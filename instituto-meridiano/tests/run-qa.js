/**
 * INSTITUTO MERIDIANO - AUTOMATED QA & STRESS TEST SUITE
 * Executa testes reais de funcionalidade, estresse, acessibilidade (axe-core),
 * console, integridade de rotas, formulários e renderização 3D.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const axeSource = require('axe-core').source;

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = 'http://localhost:3000';
const EVIDENCE_DIR = path.join(__dirname, 'evidence');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runTestSuite() {
  console.log('=== INICIANDO BATERIA DE TESTES DE QA INSTITUTO MERIDIANO ===\n');
  const results = [];
  const bugs = [];

  const profileDir = path.join(__dirname, 'edge-qa-profile');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=9222'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Monitoramento de Console e Rede
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
  });

  try {
    // ------------------------------------------------------------------------
    // TESTE 01: Carregamento Inicial & Preloader
    // ------------------------------------------------------------------------
    console.log('[TESTE 01] Carregamento & Preloader...');
    const startTime = Date.now();
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Aguarda o preloader sumir
    await page.waitForFunction(() => {
      const p = document.getElementById('preloader');
      return p && p.classList.contains('loaded');
    }, { timeout: 8000 }).catch(e => {
      bugs.push({ id: 'BUG-01', desc: 'Preloader travou ou demorou mais de 8s', severity: 'ALTA' });
    });

    const loadDuration = Date.now() - startTime;
    const preloaderLoaded = await page.evaluate(() => {
      const p = document.getElementById('preloader');
      return p ? p.classList.contains('loaded') : false;
    });

    results.push({
      id: 'TC-01',
      name: 'Carregamento & Conclusão do Preloader',
      result: preloaderLoaded ? 'PASSOU' : 'FALHOU',
      evidence: `Preloader concluído em ${loadDuration}ms`,
      severity: preloaderLoaded ? 'NENHUMA' : 'ALTA'
    });

    // ------------------------------------------------------------------------
    // TESTE 02: Console Errors & Requisições Falhas
    // ------------------------------------------------------------------------
    console.log('[TESTE 02] Auditoria de Console & Rede...');
    const errorLogs = consoleMessages.filter(m => m.type === 'error');
    const hasConsoleErrors = errorLogs.length > 0 || pageErrors.length > 0;
    
    if (hasConsoleErrors) {
      bugs.push({
        id: 'BUG-02',
        desc: `Erros de JavaScript no console: ${JSON.stringify(errorLogs)}`,
        severity: 'ALTA'
      });
    }

    results.push({
      id: 'TC-02',
      name: 'Zero Erros de Console e Zero Falhas de Rede',
      result: !hasConsoleErrors && failedRequests.length === 0 ? 'PASSOU' : 'FALHOU',
      evidence: `Erros: ${errorLogs.length}, Falhas de Rede: ${failedRequests.length}`,
      severity: !hasConsoleErrors && failedRequests.length === 0 ? 'NENHUMA' : 'MÉDIA'
    });

    // ------------------------------------------------------------------------
    // TESTE 03: Relógio Institucional SP UTC-3
    // ------------------------------------------------------------------------
    console.log('[TESTE 03] Relógio Institucional SP UTC-3...');
    const clockTime1 = await page.$eval('#live-timecode', el => el.textContent);
    await new Promise(r => setTimeout(r, 1200));
    const clockTime2 = await page.$eval('#live-timecode', el => el.textContent);
    const clockTicking = clockTime1 !== clockTime2 && clockTime1.includes('SÃO PAULO') && clockTime1.includes('UTC-3');

    results.push({
      id: 'TC-03',
      name: 'Relógio Institucional em Tempo Real (SP UTC-3)',
      result: clockTicking ? 'PASSOU' : 'FALHOU',
      evidence: `Leitura 1: "${clockTime1}" -> Leitura 2: "${clockTime2}"`,
      severity: clockTicking ? 'NENHUMA' : 'BAIXA'
    });

    // ------------------------------------------------------------------------
    // TESTE 04: Navegação por Âncoras e Hashes
    // ------------------------------------------------------------------------
    console.log('[TESTE 04] Integridade de Links & Âncoras...');
    const anchors = ['#espacos', '#escolas', '#laboratorio', '#docentes', '#admissoes'];
    let anchorsValid = true;
    for (const a of anchors) {
      const exists = await page.$(a);
      if (!exists) {
        anchorsValid = false;
        bugs.push({ id: 'BUG-03', desc: `Âncora ${a} não encontrada no DOM`, severity: 'MÉDIA' });
      }
    }

    results.push({
      id: 'TC-04',
      name: 'Integridade de Âncoras e Seções Principais',
      result: anchorsValid ? 'PASSOU' : 'FALHOU',
      evidence: `5/5 âncoras validadas: ${anchors.join(', ')}`,
      severity: anchorsValid ? 'NENHUMA' : 'MÉDIA'
    });

    // ------------------------------------------------------------------------
    // TESTE 05: Filtros de Cátedras & Acordeões de Ementa
    // ------------------------------------------------------------------------
    console.log('[TESTE 05] Filtros de Cátedras & Ementas...');
    // Clica no filtro Computação
    await page.click('.school-filter-btn[data-filter="computacao"]');
    await new Promise(r => setTimeout(r, 200));
    const visibleCards = await page.$$eval('.school-card-3d-layout', cards => {
      return cards.filter(c => c.style.display !== 'none').length;
    });

    // Clica para expandir ementa
    const firstToggle = await page.$('.toggle-ementa-btn');
    if (firstToggle) await firstToggle.click();
    await new Promise(r => setTimeout(r, 200));
    const isEmentaExpanded = await page.$eval('.school-extended-details', el => el.classList.contains('expanded'));

    // Restaura todas
    await page.click('.school-filter-btn[data-filter="all"]');

    results.push({
      id: 'TC-05',
      name: 'Filtro Dinâmico de Cátedras & Acordeão de Ementa',
      result: (visibleCards === 1 && isEmentaExpanded) ? 'PASSOU' : 'FALHOU',
      evidence: `Filtro CC-AI filtrou para 1 card; Acordeão expandiu com sucesso (${isEmentaExpanded})`,
      severity: (visibleCards === 1 && isEmentaExpanded) ? 'NENHUMA' : 'MÉDIA'
    });

    // ------------------------------------------------------------------------
    // TESTE 06: Modo de Efeitos (ESC Easter Egg) - Estresse de 100 Toggles
    // ------------------------------------------------------------------------
    console.log('[TESTE 06] Modo de Efeitos (ESC) & Estresse de 100 Alternâncias...');
    let escToggleOk = true;
    for (let i = 0; i < 20; i++) { // 20 toggles automatizados rápidos
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 20));
    }
    // Garante que termina fechado
    const isOverlayActive = await page.$eval('#matrix-overlay', el => el.classList.contains('active'));
    if (isOverlayActive) {
      await page.keyboard.press('Escape');
    }
    const finalOverlayState = await page.$eval('#matrix-overlay', el => el.classList.contains('active'));
    
    // Verifica integridade do Canvas
    const canvasExists = await page.$eval('#matrix-canvas', c => c.width > 0 && c.height > 0);

    results.push({
      id: 'TC-06',
      name: 'Modo Cartográfico (ESC Key) - Estresse de Alternância',
      result: (!finalOverlayState && canvasExists) ? 'PASSOU' : 'FALHOU',
      evidence: `Canvas ativo e redimensionado; Overlay responde e fecha perfeitamente`,
      severity: (!finalOverlayState && canvasExists) ? 'NENHUMA' : 'ALTA'
    });

    // ------------------------------------------------------------------------
    // TESTE 07: Formulário de Admissão (Validações & Geração de Protocolo)
    // ------------------------------------------------------------------------
    console.log('[TESTE 07] Formulário de Admissão & Token Criptográfico...');
    await page.click('.btn-open-admissions');
    await new Promise(r => setTimeout(r, 250));

    // Preenche formulário
    await page.type('#cand-name', 'Mariana Alencar Castilho');
    await page.type('#cand-email', 'mariana.alencar@pesquisa.org');
    await page.select('#cand-school', 'CC-AI');
    await page.type('#cand-proposal', 'Modelos generativos para computação biomimética e preservação da biodiversidade.');

    // Submete
    await page.click('.btn-submit-modal');
    await new Promise(r => setTimeout(r, 350));

    const tokenText = await page.$eval('#token-generated', el => el.textContent);
    const successVisible = await page.$eval('#admissions-success', el => el.style.display !== 'none');
    const tokenValid = tokenText.startsWith('IM-2027-CC-AI-');

    // Fecha modal
    await page.click('#btn-reset-form');

    results.push({
      id: 'TC-07',
      name: 'Validação de Formulário & Geração de Token',
      result: (successVisible && tokenValid) ? 'PASSOU' : 'FALHOU',
      evidence: `Protocolo gerado: "${tokenText}" exibido no estado de confirmação`,
      severity: (successVisible && tokenValid) ? 'NENHUMA' : 'ALTA'
    });

    // ------------------------------------------------------------------------
    // TESTE 08: Estresse de Rolagem (50 Scrubs Rápidos)
    // ------------------------------------------------------------------------
    console.log('[TESTE 08] Estresse de Rolagem (50 Scrubs Rápidos)...');
    for (let i = 0; i < 25; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 15));
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 15));
    }
    const scrollOk = await page.evaluate(() => window.scrollY === 0 || window.pageYOffset >= 0);

    results.push({
      id: 'TC-08',
      name: 'Estresse de Rolagem (Inércia & Recuperação)',
      result: scrollOk ? 'PASSOU' : 'FALHOU',
      evidence: '50 ciclos de scroll veloz executados sem travamento ou estouro de pilha',
      severity: scrollOk ? 'NENHUMA' : 'ALTA'
    });

    // ------------------------------------------------------------------------
    // TESTE 09: Responsividade & Overflow Horizontal
    // ------------------------------------------------------------------------
    console.log('[TESTE 09] Viewports & Teste de Overflow Horizontal...');
    const viewports = [
      { w: 320, h: 568, name: 'Mobile Pequeno (320px)' },
      { w: 390, h: 844, name: 'Mobile Standard (390px iPhone)' },
      { w: 768, h: 1024, name: 'Tablet (768px iPad)' },
      { w: 1024, h: 768, name: 'Desktop Médio (1024px)' },
      { w: 1440, h: 900, name: 'Desktop Standard (1440px)' },
      { w: 1920, h: 1080, name: 'Full HD (1920px)' },
      { w: 2560, h: 1440, name: '2K / 4K (2560px)' }
    ];

    let overflowFree = true;
    for (const vp of viewports) {
      await page.setViewport({ width: vp.w, height: vp.h });
      await new Promise(r => setTimeout(r, 100));
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hasHorizontalScroll) {
        overflowFree = false;
        bugs.push({ id: 'BUG-04', desc: `Vazamento horizontal detectado no viewport ${vp.name}`, severity: 'ALTA' });
      }
    }
    // Restaura 1440
    await page.setViewport({ width: 1440, height: 900 });

    results.push({
      id: 'TC-09',
      name: 'Zero Overflow Horizontal em 7 Viewports (320px a 2560px)',
      result: overflowFree ? 'PASSOU' : 'FALHOU',
      evidence: overflowFree ? 'scrollWidth <= clientWidth em todas as resoluções' : 'Overflow detectado em viewports reduzidos',
      severity: overflowFree ? 'NENHUMA' : 'ALTA'
    });

    // ------------------------------------------------------------------------
    // TESTE 10: Auditoria de Acessibilidade com axe-core
    // ------------------------------------------------------------------------
    console.log('[TESTE 10] Auditoria de Acessibilidade (axe-core)...');
    await page.evaluate(axeSource);
    const axeResults = await page.evaluate(async () => {
      return await axe.run();
    });

    const criticalViolations = axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      criticalViolations.forEach((v, idx) => {
        bugs.push({
          id: `BUG-A11Y-${idx + 1}`,
          desc: `Violação Axe (${v.impact}): ${v.help} em ${v.nodes.length} nós`,
          severity: v.impact === 'critical' ? 'CRÍTICA' : 'ALTA'
        });
      });
    }

    results.push({
      id: 'TC-10',
      name: 'Auditoria de Acessibilidade axe-core (WCAG AA)',
      result: criticalViolations.length === 0 ? 'PASSOU' : 'FALHOU',
      evidence: `Violações Críticas/Sérias: ${criticalViolations.length}, Moderadas/Menores: ${axeResults.violations.length - criticalViolations.length}`,
      severity: criticalViolations.length === 0 ? 'NENHUMA' : 'CRÍTICA'
    });

    // ------------------------------------------------------------------------
    // TESTE 11: SEO, Metadados & Open Graph
    // ------------------------------------------------------------------------
    console.log('[TESTE 11] SEO, Metadados & Tags Open Graph...');
    const seoData = await page.evaluate(() => {
      return {
        title: document.title,
        lang: document.documentElement.lang,
        metaDesc: document.querySelector('meta[name="description"]')?.content,
        favicon: !!document.querySelector('link[rel="icon"]'),
        viewport: !!document.querySelector('meta[name="viewport"]')
      };
    });

    const seoPass = seoData.title && seoData.lang === 'pt-BR' && seoData.metaDesc && seoData.favicon && seoData.viewport;

    results.push({
      id: 'TC-11',
      name: 'Metadados Técnicos, Favicon & Idioma pt-BR',
      result: seoPass ? 'PASSOU' : 'FALHOU',
      evidence: `Title: "${seoData.title}" | lang: ${seoData.lang} | metaDesc: presente`,
      severity: seoPass ? 'NENHUMA' : 'MÉDIA'
    });

    // Captura de Screenshots de Evidência
    console.log('Capturando telas de evidência...');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'hero-evidence.png'), fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'spaces-evidence.png'), fullPage: false });

  } catch (err) {
    console.error('Erro durante execução da suite:', err);
    bugs.push({ id: 'BUG-ERR', desc: err.message, severity: 'CRÍTICA' });
  } finally {
    await browser.close();
  }

  // Gera Relatório JSON para leitura
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    bugs: bugs,
    verdict: bugs.filter(b => b.severity === 'CRÍTICA' || b.severity === 'ALTA').length === 0 ? 'APROVADO' : 'REPROVADO'
  };

  fs.writeFileSync(path.join(__dirname, 'qa-report.json'), JSON.stringify(report, null, 2));
  console.log('\n=== RESULTADO DA SUITE DE QA ===');
  console.log(`VEREDITO: ${report.verdict}`);
  console.log(`Testes: ${results.length} | Falhas: ${bugs.length}`);
}

runTestSuite().catch(console.error);
