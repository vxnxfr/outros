/**
 * INSTITUTO MERIDIANO - CALM & DETAILED FEATURE WALKTHROUGH
 * Gravação detalhada, calma e elegante (sem narração, sem música)
 * Duração: ~1min40s a 25 FPS
 * 
 * Roteiro:
 * 1. Topo & Navegação: Relógio ao vivo UTC-3, menu do header, card 3D com rotação suave e reflexo especular
 * 2. Espaços de Estudo 3D: Galeria com hover tranquilo nos 3 cards (Biblioteca, IA Lab, Design Studio)
 * 3. As Quatro Cátedras: Filtros de curso (Computação & IA, Design, Todas) e expansão da Ementa de 8 semestres
 * 4. Easter Egg Cartográfico (ESC): Matriz topológica com física de nós e drag-and-drop interativo
 * 5. Pesquisa Aplicada & Corpo Docente: Projetos do Meridiano Lab e tabela de professores titulares
 * 6. CANDIDATURA DE TESTE COMPLETA:
 *    - Abertura suave do modal
 *    - Preenchimento calmo e realista dos campos (Nome, E-mail, Cátedra, Linha de Pesquisa)
 *    - Envio do formulário
 *    - Exibição pausada do Protocolo Criptográfico Oficial gerado e dossiê do candidato
 *    - Fechamento do modal
 * 7. Rodapé Monumental: Cópia do e-mail com toast de confirmação e tipografia monumental
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG_PATH = require('ffmpeg-static');
const ROOT_DIR = path.join(__dirname, '..');
const VIDEO_DIR = path.join(ROOT_DIR, 'video');
const FRAMES_DIR = path.join(VIDEO_DIR, 'calm_demo_frames');

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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Servidor interno leve para garantir estabilidade absoluta de conexão
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let cleanUrl = req.url.split('?')[0];
      if (cleanUrl === '/') cleanUrl = '/index.html';
      const filePath = path.join(ROOT_DIR, cleanUrl);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 // Arquivo não encontrado');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[Servidor Local Calmo Ativo na porta ${port}]`);
      resolve({ server, port });
    });
  });
}

async function captureCalmShowcase() {
  console.log('=== GRAVANDO VÍDEO COMPLETO, CALMO E DETALHADO (SEM ÁUDIO) ===\n');

  // Limpa frames antigos
  const oldFiles = fs.readdirSync(FRAMES_DIR);
  for (const f of oldFiles) {
    if (f.endsWith('.jpg')) fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  const { server, port } = await startServer();
  const targetUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500)); // Aguarda preloader

  let frameIndex = 0;
  async function snap(count = 1) {
    for (let c = 0; c < count; c++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 90 });
      frameIndex++;
    }
  }

  // Interpolação de movimento do mouse em curva suave (ease-in-out)
  async function smoothMouseMove(startX, startY, endX, endY, steps = 15) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const easeT = 0.5 - Math.cos(t * Math.PI) / 2;
      const x = lerp(startX, endX, easeT);
      const y = lerp(startY, endY, easeT);
      await page.mouse.move(x, y);
      await snap(1);
    }
  }

  // Interpolação suave de scroll com física cúbica de desaceleração
  async function smoothScrollTo(targetY, steps = 24) {
    const currentY = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const easeT = 1 - Math.pow(1 - t, 3);
      const y = lerp(currentY, targetY, easeT);
      await page.evaluate(top => window.scrollTo(0, top), y);
      await snap(1);
    }
  }

  // Digitação realista com pausas
  async function typeSlowly(selector, text, charsPerFrame = 2) {
    await page.focus(selector);
    await snap(4);
    for (let i = 0; i < text.length; i += charsPerFrame) {
      const chunk = text.substr(i, charsPerFrame);
      await page.keyboard.type(chunk);
      await snap(2);
    }
    await snap(6);
  }

  // -------------------------------------------------------------------------
  // 1. HERO, RELÓGIO AO VIVO & 3D TILT CALMO (0s - 14s)
  // -------------------------------------------------------------------------
  console.log('[1/7] Topo, Relógio do Campus e Card 3D com Perspectiva Calma...');
  await snap(30); // 1.2s contemplando o topo e relógio ao vivo

  // Passeia o cursor pelos links de navegação com calma
  await smoothMouseMove(960, 500, 680, 42, 16); // Cátedras
  await snap(10);
  await smoothMouseMove(680, 42, 790, 42, 14);  // Espaços
  await snap(10);
  await smoothMouseMove(790, 42, 910, 42, 14);  // Laboratórios
  await snap(10);
  await smoothMouseMove(910, 42, 1030, 42, 14); // Docentes
  await snap(10);
  await smoothMouseMove(1030, 42, 1150, 42, 14); // Admissão
  await snap(12);

  // Move o mouse até o card 3D principal (Hero)
  await smoothMouseMove(1150, 42, 1220, 460, 20);
  await snap(10);

  // Movimento de perspectiva 3D circular e tranquilo para exibir reflexo e profundidade Z
  await smoothMouseMove(1220, 460, 1380, 390, 18);
  await snap(8);
  await smoothMouseMove(1380, 390, 1420, 580, 18);
  await snap(8);
  await smoothMouseMove(1420, 580, 1160, 560, 18);
  await snap(8);
  await smoothMouseMove(1160, 560, 1260, 480, 16);
  await snap(20);

  // -------------------------------------------------------------------------
  // 2. ESPAÇOS DE ESTUDO & FOTOS 3D PREMIUM (14s - 28s)
  // -------------------------------------------------------------------------
  console.log('[2/7] Espaços de Estudo 3D com Movimentos Tranquilos...');
  await smoothScrollTo(1050, 28);
  await snap(25); // Pausa para leitura do título da seção

  // Card 1: Biblioteca Monumental
  await smoothMouseMove(1260, 480, 420, 420, 20);
  await snap(15);
  // Movimento de profundidade sobre o card
  await smoothMouseMove(420, 420, 520, 370, 12);
  await smoothMouseMove(520, 370, 380, 460, 14);
  await snap(15);

  // Card 2: Laboratório de IA
  await smoothMouseMove(380, 460, 960, 430, 18);
  await snap(15);
  await smoothMouseMove(960, 430, 1040, 390, 12);
  await smoothMouseMove(1040, 390, 920, 470, 14);
  await snap(15);

  // Card 3: Estúdio de Design
  await smoothMouseMove(920, 470, 1450, 450, 18);
  await snap(15);
  await smoothMouseMove(1450, 450, 1520, 400, 12);
  await smoothMouseMove(1520, 400, 1400, 480, 14);
  await snap(20);

  // -------------------------------------------------------------------------
  // 3. AS QUATRO CÁTEDRAS, FILTROS & EMENTA CURRICULAR (28s - 48s)
  // -------------------------------------------------------------------------
  console.log('[3/7] Cátedras, Filtros e Expansão da Ementa de 8 Semestres...');
  await smoothScrollTo(2050, 28);
  await snap(25);

  // Clica no filtro "Computação & IA"
  const btnComp = await page.$('.school-filter-btn[data-filter="computacao"]');
  if (btnComp) {
    const box = await btnComp.boundingBox();
    if (box) {
      await smoothMouseMove(1400, 480, box.x + box.width / 2, box.y + box.height / 2, 16);
      await snap(8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(35); // Pausa calma para observar os cards filtrados
    }
  }

  // Clica no filtro "Design & Futuros"
  const btnDesign = await page.$('.school-filter-btn[data-filter="design"]');
  if (btnDesign) {
    const box = await btnDesign.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 40, box.y, box.x + box.width / 2, box.y + box.height / 2, 14);
      await snap(8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(35); // Observa filtro aplicado com calma
    }
  }

  // Volta para "Todas as Cátedras"
  const btnAll = await page.$('.school-filter-btn[data-filter="all"]');
  if (btnAll) {
    const box = await btnAll.boundingBox();
    if (box) {
      await smoothMouseMove(box.x + 80, box.y, box.x + box.width / 2, box.y + box.height / 2, 14);
      await snap(6);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(25);
    }
  }

  // Abre a Ementa Curricular Completa do primeiro curso
  const toggleBtn = await page.$('.toggle-ementa-btn');
  if (toggleBtn) {
    const box = await toggleBtn.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 50, box.y, box.x + box.width / 2, box.y + box.height / 2, 16);
      await snap(8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(20);
      // Rola um pouco para enquadrar a ementa de 8 semestres
      await smoothScrollTo(2380, 18);
      await snap(60); // 2.4s inteiros para o espectador ler as disciplinas com clareza
    }
  }

  // -------------------------------------------------------------------------
  // 4. MODO CARTOGRÁFICO INTERATIVO / TECLA ESC (48s - 63s)
  // -------------------------------------------------------------------------
  console.log('[4/7] Matriz Topológica (Tecla ESC) com Drag & Drop de Nós...');
  await page.keyboard.press('Escape');
  await snap(30); // 1.2s observando a constelação de nós

  // Move o mouse até um dos nós da rede de conhecimento
  await smoothMouseMove(800, 600, 430, 360, 18);
  await snap(12);

  // Clica e arrasta o nó topológico com física de mola visível
  await page.mouse.down();
  await smoothMouseMove(430, 360, 620, 480, 24);
  await snap(10);
  await page.mouse.up();
  await snap(20); // O nó oscila suavemente com a física de molas

  // Passa sobre o nó central para revelar a ficha epistêmica
  await smoothMouseMove(620, 480, 780, 370, 16);
  await snap(35); // 1.4s inspecionando detalhes do nó

  // Fecha o modo cartográfico
  await page.keyboard.press('Escape');
  await snap(20);

  // -------------------------------------------------------------------------
  // 5. LABORATÓRIOS DE PESQUISA & CORPO DOCENTE (63s - 75s)
  // -------------------------------------------------------------------------
  console.log('[5/7] Laboratórios Aplicados e Professores Titulares...');
  await smoothScrollTo(3200, 26);
  await snap(25);
  // Passeia com calma sobre os laboratórios
  await smoothMouseMove(780, 370, 450, 450, 16);
  await snap(15);
  await smoothMouseMove(450, 450, 950, 450, 16);
  await snap(20);

  // Tabela de Docentes
  await smoothScrollTo(3900, 26);
  await snap(20);
  // Hover tranquilo nas linhas de docentes
  await smoothMouseMove(950, 450, 700, 380, 14);
  await snap(12);
  await smoothMouseMove(700, 380, 700, 480, 14);
  await snap(12);
  await smoothMouseMove(700, 480, 700, 580, 14);
  await snap(25);

  // -------------------------------------------------------------------------
  // 6. CANDIDATURA DE TESTE COMPLETA & CRIPTOGRAFIA (75s - 105s)
  // -------------------------------------------------------------------------
  console.log('[6/7] Simulação Completa e Calma de Candidatura de Teste...');
  await smoothScrollTo(4650, 26);
  await snap(25);

  // Clica no botão de abertura de candidatura
  const ctaBtn = await page.$('.admissions-banner-cta .btn-open-admissions');
  if (ctaBtn) {
    const box = await ctaBtn.boundingBox();
    if (box) {
      await smoothMouseMove(700, 580, box.x + box.width / 2, box.y + box.height / 2, 16);
      await snap(10);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(30); // Modal se abre elegantemente com backdrop blur
    }
  }

  // Preenchimento calmo e realista do formulário
  console.log('   -> Digitando Nome do Candidato...');
  await smoothMouseMove(960, 540, 850, 340, 14);
  await typeSlowly('#cand-name', 'Lucas Albuquerque de Mendonça', 1);
  await snap(15);

  console.log('   -> Digitando E-mail Institucional...');
  await smoothMouseMove(850, 340, 850, 420, 12);
  await typeSlowly('#cand-email', 'lucas.albuquerque@meridiano.edu.br', 2);
  await snap(15);

  console.log('   -> Selecionando Cátedra...');
  await smoothMouseMove(850, 420, 850, 500, 12);
  await page.focus('#cand-school');
  await page.select('#cand-school', 'CC-AI');
  await snap(20);

  console.log('   -> Digitando Proposta de Pesquisa...');
  await smoothMouseMove(850, 500, 850, 590, 12);
  await typeSlowly('#cand-proposal', 'Modelagem neural de fronteira, sistemas cognitivos abertos e epistemologia da inteligência artificial autônoma.', 2);
  await snap(30); // 1.2s permitindo leitura completa do formulário preenchido

  // Move o mouse até o botão de envio
  console.log('   -> Clicando em Enviar Candidatura...');
  const submitBtn = await page.$('.btn-submit-modal');
  if (submitBtn) {
    const box = await submitBtn.boundingBox();
    if (box) {
      await smoothMouseMove(850, 590, box.x + box.width / 2, box.y + box.height / 2, 14);
      await snap(10);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      
      // ESTADO DE SUCESSO: EXIBIÇÃO TRANQUILA E LEGÍVEL DO PROTOCOLO CRIPTOGRÁFICO
      console.log('   -> Exibindo Protocolo Criptográfico com calma (6 segundos)...');
      await snap(150); // 6 segundos completos em 25fps para leitura detalhada de todo o recibo!
    }
  }

  // Fecha o modal pelo botão de conclusão
  const resetBtn = await page.$('#btn-reset-form');
  if (resetBtn) {
    const box = await resetBtn.boundingBox();
    if (box) {
      await smoothMouseMove(960, 540, box.x + box.width / 2, box.y + box.height / 2, 14);
      await snap(8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(20);
    }
  }

  // -------------------------------------------------------------------------
  // 7. RODAPÉ COM TOAST DE E-MAIL & TIPOGRAFIA MONUMENTAL (105s - 115s)
  // -------------------------------------------------------------------------
  console.log('[7/7] Cópia de E-mail com Toast e Rodapé Monumental...');
  await smoothScrollTo(5450, 24);
  await snap(20);

  // Clica no botão de cópia de e-mail da secretaria
  const copyBtn = await page.$('.btn-copy-clipboard');
  if (copyBtn) {
    const box = await copyBtn.boundingBox();
    if (box) {
      await smoothMouseMove(960, 500, box.x + box.width / 2, box.y + box.height / 2, 14);
      await snap(8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(45); // 1.8s com o Toast visível na tela
    }
  }

  // Rola até o monumento final de encerramento
  await smoothScrollTo(6000, 20);
  await snap(50); // 2s com o encerramento monumental na tela

  await browser.close();
  server.close();
  console.log(`\nGravação concluída: total de ${frameIndex} quadros capturados.`);

  // -------------------------------------------------------------------------
  // RENDERIZAÇÃO FFMPEG: 16:9 FULL HD (25 FPS, SEM ÁUDIO)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // RENDERIZAÇÃO FFMPEG: 9:16 VERTICAL REELS / STORIES (1080x1920, SEM ÁUDIO)
  // -------------------------------------------------------------------------
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

  // Atualiza também os arquivos padrão master
  fs.copyFileSync(master16x9, path.join(VIDEO_DIR, 'instituto-meridiano-master.mp4'));
  fs.copyFileSync(reels9x16, path.join(VIDEO_DIR, 'instituto-meridiano-reels-45s.mp4'));

  console.log('\n=== RENDERIZAÇÃO CONCLUÍDA COM SUCESSO! ===');
  console.log(`16:9 MP4: ${master16x9}`);
  console.log(`9:16 MP4: ${reels9x16}`);
}

captureCalmShowcase().catch(err => {
  console.error('Erro na gravação:', err);
  process.exit(1);
});

