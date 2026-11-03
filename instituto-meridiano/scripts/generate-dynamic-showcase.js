/**
 * INSTITUTO MERIDIANO - DYNAMIC FEATURE WALKTHROUGH (NO NARRATION, NO MUSIC)
 * Vídeo dinâmico, fluido e ágil (~35 segundos a 30 FPS)
 * Mostra TODAS as abas, seções e funcionalidades do site sem enrolação:
 * 1. Header, Navegação, Relógio ao vivo UTC-3 & Hero 3D Card Tilt
 * 2. Galeria 3D dos Espaços de Estudo com profundidade Z e reflexo especular
 * 3. As Quatro Cátedras: filtros interativos por área e acordeão de ementa
 * 4. Matriz Topológica Easter Egg (Tecla ESC) com nós interativos arrastáveis
 * 5. Laboratórios de Pesquisa e Corpo Docente
 * 6. Modal de Admissão 2027: preenchimento e geração de Protocolo Criptográfico
 * 7. Rodapé com Toast animado de cópia de e-mail e tipografia monumental
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
const FRAMES_DIR = path.join(VIDEO_DIR, 'dynamic_showcase_frames');

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Servidor interno embutido para garantir conexão 100% confiável
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

function startInternalServer() {
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
      console.log(`Servidor de captura ativo em http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
  });
}

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

async function captureDynamicShowcase() {
  console.log('=== GRAVANDO VÍDEO COMPLETO E DINÂMICO DE FUNCIONALIDADES (SEM ÁUDIO) ===\n');

  const { server, port } = await startInternalServer();
  const targetUrl = `http://127.0.0.1:${port}`;

  // Limpa frames antigos
  const oldFiles = fs.readdirSync(FRAMES_DIR);
  for (const f of oldFiles) {
    if (f.endsWith('.jpg')) fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  const tmpDir = path.join(ROOT_DIR, '.tmp_edge_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    userDataDir: tmpDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto(targetUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200)); // Aguarda preloader

  let frameIndex = 0;
  async function snap(count = 1) {
    for (let c = 0; c < count; c++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 90 });
      frameIndex++;
    }
  }

  // Interpolação de movimento do mouse
  async function smoothMouseMove(startX, startY, endX, endY, steps = 10) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const easeT = 0.5 - Math.cos(t * Math.PI) / 2;
      const x = lerp(startX, endX, easeT);
      const y = lerp(startY, endY, easeT);
      await page.mouse.move(x, y);
      await snap(1);
    }
  }

  // Interpolação suave de scroll
  async function smoothScrollTo(targetY, steps = 14) {
    const currentY = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const easeT = 1 - Math.pow(1 - t, 3);
      const y = lerp(currentY, targetY, easeT);
      await page.evaluate(top => window.scrollTo(0, top), y);
      await snap(1);
    }
  }

  // -------------------------------------------------------------------------
  // 1. HERO, NAVEGAÇÃO & 3D TILT EFFECT (0s - 5s)
  // -------------------------------------------------------------------------
  console.log('[1/7] Hero, Menu e Card 3D com Efeito de Perspectiva...');
  await snap(12);

  // Passa o mouse pelos itens do menu no topo
  await smoothMouseMove(960, 500, 750, 40, 8);
  await smoothMouseMove(750, 40, 880, 40, 8);
  await smoothMouseMove(880, 40, 1000, 40, 8);
  await snap(6);

  // Move o mouse para o Card 3D principal (Hero)
  await smoothMouseMove(1000, 40, 1200, 480, 12);
  await snap(4);
  // Percorre o card mostrando rotação 3D e brilho especular dinâmico
  await smoothMouseMove(1200, 480, 1380, 420, 10);
  await smoothMouseMove(1380, 420, 1420, 600, 10);
  await smoothMouseMove(1420, 600, 1180, 580, 10);
  await smoothMouseMove(1180, 580, 1280, 500, 8);
  await snap(8);

  // -------------------------------------------------------------------------
  // 2. ESPAÇOS DE ESTUDO & FOTOS 3D PREMIUM (5s - 10s)
  // -------------------------------------------------------------------------
  console.log('[2/7] Galeria de Espaços de Estudo com Efeito 3D...');
  await smoothScrollTo(1050, 16);
  await snap(12);

  // Passa o mouse sobre os cards da galeria destacando as fotos e tags
  await smoothMouseMove(1280, 500, 450, 420, 10);
  await snap(8);
  await smoothMouseMove(450, 420, 960, 440, 10);
  await snap(8);
  await smoothMouseMove(960, 440, 1450, 460, 10);
  await snap(10);

  // -------------------------------------------------------------------------
  // 3. AS QUATRO CÁTEDRAS, ABAS DE FILTROS & EMENTA (10s - 18s)
  // -------------------------------------------------------------------------
  console.log('[3/7] Filtros das Cátedras e Expansão da Ementa...');
  await smoothScrollTo(2050, 16);
  await snap(10);

  // Clica no filtro "Computação & IA"
  const btnComp = await page.$('.school-filter-btn[data-filter="computacao"]');
  if (btnComp) {
    const box = await btnComp.boundingBox();
    if (box) {
      await smoothMouseMove(1450, 460, box.x + box.width / 2, box.y + box.height / 2, 10);
      await snap(3);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(16);
    }
  }

  // Clica no filtro "Design & Futuros"
  const btnDesign = await page.$('.school-filter-btn[data-filter="design"]');
  if (btnDesign) {
    const box = await btnDesign.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 20, box.y, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(16);
    }
  }

  // Volta para "Todas as Cátedras"
  const btnAll = await page.$('.school-filter-btn[data-filter="all"]');
  if (btnAll) {
    const box = await btnAll.boundingBox();
    if (box) {
      await smoothMouseMove(box.x + 80, box.y, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(12);
    }
  }

  // Abre a Ementa Curricular Completa
  const toggleBtn = await page.$('.toggle-ementa-btn');
  if (toggleBtn) {
    const box = await toggleBtn.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 40, box.y, box.x + box.width / 2, box.y + box.height / 2, 10);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(24);
    }
  }

  // -------------------------------------------------------------------------
  // 4. MODO CARTOGRÁFICO INTERATIVO / TECLA ESC (18s - 25s)
  // -------------------------------------------------------------------------
  console.log('[4/7] Easter Egg Cartográfico (Tecla ESC) com Drag & Drop...');
  await page.keyboard.press('Escape');
  await snap(14);

  // Move o mouse até um dos nós da constelação
  await smoothMouseMove(800, 600, 420, 340, 10);
  await snap(6);

  // Clica e arrasta o nó topológico em tempo real (física de Canvas 2D)
  await page.mouse.down();
  await smoothMouseMove(420, 340, 580, 460, 14);
  await page.mouse.up();
  await snap(12);

  // Passa sobre o nó central para revelar a ficha de inspeção
  await smoothMouseMove(580, 460, 780, 360, 10);
  await snap(14);

  // Fecha o modo cartográfico pressionando ESC
  await page.keyboard.press('Escape');
  await snap(10);

  // -------------------------------------------------------------------------
  // 5. LABORATÓRIOS DE PESQUISA & CORPO DOCENTE (25s - 29s)
  // -------------------------------------------------------------------------
  console.log('[5/7] Laboratórios e Corpo Docente...');
  await smoothScrollTo(3150, 16);
  await snap(10);
  await smoothMouseMove(780, 360, 450, 450, 10);
  await smoothMouseMove(450, 450, 950, 450, 8);
  await snap(6);

  // Tabela de Docentes
  await smoothScrollTo(3850, 16);
  await snap(8);
  await smoothMouseMove(950, 450, 700, 420, 8);
  await smoothMouseMove(700, 420, 700, 540, 8);
  await snap(10);

  // -------------------------------------------------------------------------
  // 6. MODAL DE ADMISSÃO 2027 & TOKEN CRIPTOGRÁFICO (29s - 34s)
  // -------------------------------------------------------------------------
  console.log('[6/7] Formulário de Admissão e Geração de Token...');
  await smoothScrollTo(4600, 16);
  await snap(8);

  const ctaBtn = await page.$('.admissions-banner-cta .btn-open-admissions');
  if (ctaBtn) {
    const box = await ctaBtn.boundingBox();
    if (box) {
      await smoothMouseMove(700, 540, box.x + box.width / 2, box.y + box.height / 2, 10);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(12);
    }
  }

  // Preenche dados da candidatura rapidamente
  await page.type('#cand-name', 'Beatriz Silva');
  await snap(3);
  await page.type('#cand-email', 'beatriz.silva@meridiano.edu');
  await snap(3);
  await page.select('#cand-school', 'CC-AI');
  await snap(3);
  await page.type('#cand-proposal', 'Modelagem computacional para sistemas complexos.');
  await snap(5);

  // Envia e gera o protocolo criptográfico
  const submitBtn = await page.$('.btn-submit-modal');
  if (submitBtn) {
    const box = await submitBtn.boundingBox();
    if (box) {
      await smoothMouseMove(800, 600, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(22); // Protocolo na tela
    }
  }

  // Fecha o modal
  const closeBtn = await page.$('#btn-reset-form');
  if (closeBtn) {
    const box = await closeBtn.boundingBox();
    if (box) {
      await smoothMouseMove(box.x - 20, box.y, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(8);
    }
  }

  // -------------------------------------------------------------------------
  // 7. RODAPÉ COM TOAST DE E-MAIL & TIPOGRAFIA MONUMENTAL (34s - 37s)
  // -------------------------------------------------------------------------
  console.log('[7/7] Cópia de E-mail com Toast e Rodapé...');
  await smoothScrollTo(5400, 16);
  await snap(6);

  const copyBtn = await page.$('.btn-copy-clipboard');
  if (copyBtn) {
    const box = await copyBtn.boundingBox();
    if (box) {
      await smoothMouseMove(900, 500, box.x + box.width / 2, box.y + box.height / 2, 8);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await snap(18); // Toast visível
    }
  }

  // Rola até o final e exibe o encerramento monumental
  await smoothScrollTo(6000, 14);
  await snap(20);

  await browser.close();
  server.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log(`\nGravação concluída com sucesso: ${frameIndex} quadros capturados.`);

  // -------------------------------------------------------------------------
  // RENDERIZAÇÃO FFMPEG: 16:9 FULL HD (30 FPS, SEM ÁUDIO)
  // -------------------------------------------------------------------------
  console.log('\nRenderizando vídeo 16:9 Full HD (1920x1080 @ 30 FPS, Sem Áudio)...');
  const master16x9 = path.join(VIDEO_DIR, 'instituto-meridiano-demo-16x9.mp4');

  await runFfmpeg([
    '-y',
    '-framerate', '30',
    '-i', path.join(FRAMES_DIR, 'frame_%05d.jpg'),
    '-an', // Sem áudio (sem narração, sem música)
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

  // Atualiza os arquivos padrão
  fs.copyFileSync(master16x9, path.join(VIDEO_DIR, 'instituto-meridiano-master.mp4'));
  fs.copyFileSync(reels9x16, path.join(VIDEO_DIR, 'instituto-meridiano-reels-45s.mp4'));

  console.log('\n=== RENDERIZAÇÃO CONCLUÍDA COM SUCESSO! ===');
  console.log(`16:9 MP4: ${master16x9}`);
  console.log(`9:16 MP4: ${reels9x16}`);
}

captureDynamicShowcase().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
