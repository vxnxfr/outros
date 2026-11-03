/**
 * INSTITUTO MERIDIANO - FAST-PACED INTERACTIVE FEATURE DEMO
 * Gravação ágil, dinâmica e direta (sem narração, sem música),
 * demonstrando todas as abas, filtros, ementas, 3D tilt, modo ESC e formulários.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG_PATH = require('ffmpeg-static');
const TARGET_URL = 'http://localhost:3000';
const VIDEO_DIR = path.join(__dirname, '..', 'video');
const FRAMES_DIR = path.join(VIDEO_DIR, 'fast_demo_frames');

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

// Interpolação linear suave para movimento do mouse
function lerp(a, b, t) {
  return a + (b - a) * t;
}

async function captureFastDemo() {
  console.log('=== GRAVANDO VÍDEO ÁGIL & DINÂMICO DE FUNCIONALIDADES (SEM ÁUDIO) ===\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Limpa frames antigos
  const files = fs.readdirSync(FRAMES_DIR);
  for (const f of files) {
    if (f.endsWith('.jpg')) fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500)); // Aguarda preloader concluir

  let frameIndex = 0;
  async function snap() {
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: framePath, type: 'jpeg', quality: 92 });
    frameIndex++;
  }

  // Helper para mover o mouse com gravação de frames
  async function smoothMouseMove(startX, startY, endX, endY, steps = 8) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = lerp(startX, endX, t);
      const y = lerp(startY, endY, t);
      await page.mouse.move(x, y);
      await snap();
    }
  }

  // Helper para rolagem suave com gravação de frames
  async function smoothScrollTo(targetY, steps = 12) {
    const currentY = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Curva suave ease-out
      const easeT = 1 - Math.pow(1 - t, 3);
      const y = lerp(currentY, targetY, easeT);
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await snap();
    }
    await new Promise(r => setTimeout(r, 60));
  }

  // =========================================================================
  // FASE 1: HERO & 3D TILT DA BIBLIOTECA (00:00 - 00:05)
  // =========================================================================
  console.log('[1/7] Hero & Interação 3D com o Card da Biblioteca...');
  await snap(); await snap();
  // Move o mouse rapidamente pelo card 3D para exibir o reflexo de luz e rotação
  await smoothMouseMove(960, 500, 1150, 420, 10);
  await smoothMouseMove(1150, 420, 1250, 520, 8);
  await smoothMouseMove(1250, 520, 1050, 580, 8);

  // =========================================================================
  // FASE 2: ESPAÇOS DE ESTUDO & IMERSÃO (00:05 - 00:11)
  // =========================================================================
  console.log('[2/7] Galeria de Espaços de Estudo 3D...');
  await smoothScrollTo(1150, 14);
  // Passa rapidamente sobre os cards destacando os textos saltando em Z e o glare
  await smoothMouseMove(350, 400, 450, 450, 8);
  await smoothMouseMove(450, 450, 850, 420, 8);
  await smoothMouseMove(850, 420, 1250, 450, 8);

  // =========================================================================
  // FASE 3: AS QUATRO CÁTEDRAS & FILTROS & EMENTA (00:11 - 00:19)
  // =========================================================================
  console.log('[3/7] Filtros das Cátedras & Acordeão de Ementa...');
  await smoothScrollTo(2150, 14);

  // Clica no filtro Computação & IA
  const btnComp = await page.$('.school-filter-btn[data-filter="computacao"]');
  if (btnComp) {
    const box = await btnComp.boundingBox();
    if (box) {
      await smoothMouseMove(1200, 450, box.x + box.width / 2, box.y + box.height / 2, 6);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(); await snap();
    }
  }

  // Clica no filtro Design & Futuros
  const btnDesign = await page.$('.school-filter-btn[data-filter="design"]');
  if (btnDesign) {
    const box = await btnDesign.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 30, box.y, box.x + box.width / 2, box.y + box.height / 2, 6);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(); await snap();
    }
  }

  // Volta para Todas as Cátedras
  const btnAll = await page.$('.school-filter-btn[data-filter="all"]');
  if (btnAll) {
    const box = await btnAll.boundingBox();
    if (box) {
      await smoothMouseMove(box.x + 100, box.y, box.x + box.width / 2, box.y + box.height / 2, 6);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(); await snap();
    }
  }

  // Expande a Ementa da primeira cátedra
  const toggleBtn = await page.$('.toggle-ementa-btn');
  if (toggleBtn) {
    const box = await toggleBtn.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 50, box.y, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      for (let f = 0; f < 10; f++) await snap();
    }
  }

  // =========================================================================
  // FASE 4: O MODO CARTOGRÁFICO INTERATIVO (ESC KEY) (00:19 - 00:26)
  // =========================================================================
  console.log('[4/7] Modo Cartográfico (Tecla ESC)...');
  await page.keyboard.press('Escape');
  await snap(); await snap(); await snap();

  // Arrastar nó do Canvas em tempo real
  await smoothMouseMove(500, 500, 350, 320, 8);
  await page.mouse.down();
  await smoothMouseMove(350, 320, 480, 420, 10);
  await page.mouse.up();
  await snap(); await snap();

  // Passa sobre outro nó para revelar o painel de inspeção
  await smoothMouseMove(480, 420, 750, 340, 8);
  await snap(); await snap(); await snap();

  // Fecha o modo cartográfico
  await page.keyboard.press('Escape');
  await snap(); await snap();

  // =========================================================================
  // FASE 5: LABORATÓRIO & CORPO DOCENTE (00:26 - 00:30)
  // =========================================================================
  console.log('[5/7] Pesquisa Aplicada & Tabela de Docentes...');
  await smoothScrollTo(3200, 12);
  await smoothMouseMove(500, 500, 900, 450, 8);
  await smoothScrollTo(3900, 12);
  // Hover sobre as linhas de professores
  await smoothMouseMove(400, 400, 800, 500, 8);

  // =========================================================================
  // FASE 6: MODAL DE CANDIDATURA 2027 & TOKEN CRIPTOGRÁFICO (00:30 - 00:36)
  // =========================================================================
  console.log('[6/7] Processo de Admissão & Geração de Token...');
  await smoothScrollTo(4600, 12);

  // Clica no botão de candidatura
  const ctaBtn = await page.$('.admissions-banner-cta .btn-open-admissions');
  if (ctaBtn) {
    const box = await ctaBtn.boundingBox();
    if (box) {
      await smoothMouseMove(900, 500, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(); await snap();
    }
  }

  // Preenche dados rápidos
  await page.type('#cand-name', 'Lucas Albuquerque');
  await snap();
  await page.type('#cand-email', 'lucas@meridiano.edu');
  await snap();
  await page.select('#cand-school', 'CC-AI');
  await snap();
  await page.type('#cand-proposal', 'Pesquisa em modelos de computação autônoma.');
  await snap();

  // Envia formulário e exibe o protocolo criptográfico institucional
  const submitBtn = await page.$('.btn-submit-modal');
  if (submitBtn) {
    const box = await submitBtn.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      for (let f = 0; f < 14; f++) await snap(); // Segura o protocolo na tela
    }
  }

  // Fecha modal
  const closeBtn = await page.$('#btn-reset-form');
  if (closeBtn) {
    const box = await closeBtn.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(); await snap();
    }
  }

  // =========================================================================
  // FASE 7: RODAPÉ MONUMENTAL & TOAST DE E-MAIL (00:36 - 00:40)
  // =========================================================================
  console.log('[7/7] Cópia de E-mail com Toast & Rodapé Monumental...');
  await smoothScrollTo(5400, 12);

  // Clica no botão copiar e-mail para exibir o toast animado
  const copyBtn = await page.$('.btn-copy-clipboard');
  if (copyBtn) {
    const box = await copyBtn.boundingBox();
    if (box) {
      await smoothMouseMove(box.x, box.y - 40, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      for (let f = 0; f < 12; f++) await snap(); // Toast visível
    }
  }

  // Rola até o monumento final
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  for (let f = 0; f < 10; f++) await snap();

  await browser.close();
  console.log(`\nGravação concluída: ${frameIndex} quadros capturados.`);

  // =========================================================================
  // RENDERIZAÇÃO FFMPEG: 16:9 FULL HD & 9:16 VERTICAL REELS (SEM ÁUDIO)
  // =========================================================================
  console.log('\nRenderizando vídeo 16:9 Full HD (1920x1080 @ 25 FPS, Sem Áudio)...');
  const master16x9 = path.join(VIDEO_DIR, 'instituto-meridiano-demo-16x9.mp4');

  await runFfmpeg([
    '-y',
    '-framerate', '25',
    '-i', path.join(FRAMES_DIR, 'frame_%05d.jpg'),
    '-an', // Sem áudio
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '18',
    master16x9
  ]);

  console.log('\nRenderizando versão vertical 9:16 para Reels / Stories (1080x1920, Sem Áudio)...');
  const reels9x16 = path.join(VIDEO_DIR, 'instituto-meridiano-demo-9x16.mp4');

  await runFfmpeg([
    '-y',
    '-i', master16x9,
    '-an',
    '-vf', 'crop=608:1080:656:0,scale=1080:1920',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '18',
    reels9x16
  ]);

  // Atualiza também os arquivos master padrão para que qualquer link aponte para a versão limpa
  fs.copyFileSync(master16x9, path.join(VIDEO_DIR, 'instituto-meridiano-master.mp4'));
  fs.copyFileSync(reels9x16, path.join(VIDEO_DIR, 'instituto-meridiano-reels-45s.mp4'));

  console.log('\n=== VÍDEO DE DEMONSTRAÇÃO ÁGIL RENDERIZADO COM SUCESSO! ===');
  console.log(`16:9: ${master16x9}`);
  console.log(`9:16: ${reels9x16}`);
}

captureFastDemo().catch(err => {
  console.error('Erro na gravação:', err);
  process.exit(1);
});
