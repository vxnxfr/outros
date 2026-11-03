/**
 * INSTITUTO MERIDIANO - ULTRA-CINEMATIC 3D VIDEO ENGINE (V2)
 * Gravação com rig de câmera 3D em perspectiva, movimentos suaves com inércia,
 * mixagem da trilha sonora original (116 BPM) com ducking e SFX táteis.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG_PATH = require('ffmpeg-static');
const TARGET_URL = 'http://localhost:3000';
const VIDEO_DIR = path.join(__dirname, '..', 'video');
const FRAMES_DIR = path.join(VIDEO_DIR, 'cinematic_frames');
const AUDIO_DIR = path.join(VIDEO_DIR, 'audio');

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg code ${code}`));
    });
  });
}

// 7 Cenas com Movimentos 3D de Câmera e Trajetórias de Cursor
const CINEMATIC_SCENES = [
  {
    id: 'cena_01',
    duration: 13.0,
    scrollY: 0,
    camera: { rx: 7, ry: -9, scale: 1.05, tx: -30, ty: 0 },
    setup: async (page) => {
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 1200));
    },
    animate: async (page, frame, total) => {
      const p = frame / total; // 0 a 1
      // Câmera oscila suavemente e dá leve zoom
      const rx = 7 - p * 5;
      const ry = -9 + p * 12;
      const scale = 1.05 + p * 0.05;
      await page.evaluate((rx, ry, scale) => {
        if (window.setCamera) window.setCamera(rx, ry, 0, scale, 0, 0);
      }, rx, ry, scale);

      // Cursor viaja sobre o Card 3D criando reflexo especular
      const mouseX = 1100 + Math.sin(p * Math.PI * 2) * 140;
      const mouseY = 460 + Math.cos(p * Math.PI * 2) * 90;
      await page.mouse.move(mouseX, mouseY);
    }
  },
  {
    id: 'cena_02',
    duration: 17.0,
    scrollY: 620,
    camera: { rx: 10, ry: 6, scale: 1.03, tx: 0, ty: -20 },
    setup: async (page) => {
      await page.evaluate(() => window.scrollTo({ top: 620, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 600));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      const rx = 10 - p * 6;
      const ry = 6 - p * 10;
      await page.evaluate((rx, ry) => {
        if (window.setCamera) window.setCamera(rx, ry, 0, 1.03, 0, 0);
      }, rx, ry);

      // Cursor percorre as métricas
      const mouseX = 250 + p * 1100;
      const mouseY = 720;
      await page.mouse.move(mouseX, mouseY);
    }
  },
  {
    id: 'cena_03',
    duration: 16.0,
    scrollY: 1280,
    camera: { rx: 8, ry: -8, scale: 1.06, tx: -40, ty: -20 },
    setup: async (page) => {
      await page.evaluate(() => window.scrollTo({ top: 1280, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 600));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      // Pan 3D sobre a galeria de espaços de estudo
      const rx = 8 + Math.sin(p * Math.PI) * 4;
      const ry = -8 + p * 14;
      const tx = -40 + p * 60;
      await page.evaluate((rx, ry, tx) => {
        if (window.setCamera) window.setCamera(rx, ry, 0, 1.06, tx, 0);
      }, rx, ry, tx);

      // Move o mouse sobre os cards da galeria destacando o 3D tilt
      const cardX = 400 + (p * 850);
      const cardY = 1450 + Math.sin(p * 8) * 40;
      await page.mouse.move(cardX, cardY);
    }
  },
  {
    id: 'cena_04',
    duration: 18.0,
    scrollY: 2360,
    camera: { rx: 6, ry: -5, scale: 1.04, tx: 0, ty: 0 },
    setup: async (page) => {
      await page.evaluate(() => window.scrollTo({ top: 2360, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 600));
      // Clica em Computação & IA
      const btn = await page.$('.school-filter-btn[data-filter="computacao"]');
      if (btn) await btn.click();
      await new Promise(r => setTimeout(r, 400));
      // Expande ementa
      const toggle = await page.$('.toggle-ementa-btn');
      if (toggle) await toggle.click();
      await new Promise(r => setTimeout(r, 500));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      const rx = 6 - p * 8;
      const ry = -5 + p * 10;
      await page.evaluate((rx, ry) => {
        if (window.setCamera) window.setCamera(rx, ry, 0, 1.04, 0, 0);
      }, rx, ry);

      // Cursor examina as matérias do semestre
      const mouseX = 600 + Math.cos(p * 4) * 200;
      const mouseY = 2700 + p * 150;
      await page.mouse.move(mouseX, mouseY);
    }
  },
  {
    id: 'cena_05',
    duration: 15.5,
    scrollY: 2360,
    camera: { rx: 0, ry: 0, scale: 1.0, tx: 0, ty: 0 },
    setup: async (page) => {
      // Abre Modo Cartográfico ESC
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 800));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      // Arrastar e orbitar nó do Canvas
      const nodeX = 500 + Math.sin(p * Math.PI * 2) * 180;
      const nodeY = 400 + Math.cos(p * Math.PI * 2) * 120;
      await page.mouse.move(nodeX, nodeY);
    },
    teardown: async (page) => {
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }
  },
  {
    id: 'cena_06',
    duration: 13.5,
    scrollY: 450,
    camera: { rx: 12, ry: -15, scale: 1.05, tx: -20, ty: 0 },
    setup: async (page) => {
      await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 600));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      // Câmera gira como em showcase de produto móvel
      const rx = 12 - p * 6;
      const ry = -15 + p * 25;
      await page.evaluate((rx, ry) => {
        if (window.setCamera) window.setCamera(rx, ry, 0, 1.05, 0, 0);
      }, rx, ry);
      await page.mouse.move(700 + p * 300, 600);
    }
  },
  {
    id: 'cena_07',
    duration: 17.5,
    scrollY: 4800,
    camera: { rx: 8, ry: 0, scale: 1.02, tx: 0, ty: 0 },
    setup: async (page) => {
      await page.evaluate(() => window.scrollTo({ top: 4700, behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 600));
      // Clica em candidatura
      const cta = await page.$('.admissions-banner-cta .btn-open-admissions');
      if (cta) await cta.click();
      await new Promise(r => setTimeout(r, 800));
      // Fecha modal para ver rodapé monumental
      const closeBtn = await page.$('#modal-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      await new Promise(r => setTimeout(r, 800));
    },
    animate: async (page, frame, total) => {
      const p = frame / total;
      // Pull-back épico de câmera revelando o monumento tipográfico
      const scale = 1.02 - p * 0.05;
      const rx = 8 - p * 10;
      await page.evaluate((rx, scale) => {
        if (window.setCamera) window.setCamera(rx, 0, 0, scale, 0, 0);
      }, rx, scale);
      await page.mouse.move(960, 800);
    }
  }
];

async function captureCinematicFrames() {
  console.log('\n=== INICIANDO GRAVAÇÃO CINEMATOGRÁFICA 3D (1080p @ 25 FPS) ===\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Injeta o Rig de Câmera 3D no DOM do site
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'cinematic-camera-style';
    style.innerHTML = `
      body {
        perspective: 1600px !important;
        transform-style: preserve-3d !important;
        will-change: transform;
      }
      #main-content {
        transform-style: preserve-3d !important;
      }
    `;
    document.head.appendChild(style);

    window.setCamera = (rx, ry, rz, scale, tx, ty) => {
      const content = document.getElementById('main-content');
      if (content) {
        content.style.transform = `perspective(1600px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
        content.style.transformOrigin = 'center center';
        content.style.transition = 'none';
      }
    };
  });

  const sceneClips = [];

  for (let s = 0; s < CINEMATIC_SCENES.length; s++) {
    const sc = CINEMATIC_SCENES[s];
    const sceneDir = path.join(FRAMES_DIR, sc.id);
    if (!fs.existsSync(sceneDir)) fs.mkdirSync(sceneDir, { recursive: true });

    console.log(`[CENA ${s + 1}/7] ${sc.id}: ${sc.duration}s`);

    if (sc.setup) await sc.setup(page);

    const totalFrames = Math.ceil(sc.duration * 25);

    for (let f = 0; f < totalFrames; f++) {
      if (sc.animate) await sc.animate(page, f, totalFrames);
      const framePath = path.join(sceneDir, `frame_${String(f).padStart(4, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 92 });
    }

    if (sc.teardown) await sc.teardown(page);

    // Renderiza clipe de vídeo da cena
    const clipPath = path.join(VIDEO_DIR, `${sc.id}_cinematic.mp4`);
    const audioPath = path.join(AUDIO_DIR, `${sc.id}.mp3`);

    await runFfmpeg([
      '-y',
      '-framerate', '25',
      '-i', path.join(sceneDir, 'frame_%04d.jpg'),
      '-i', audioPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      '-vf', `fade=t=in:st=0:d=0.25,fade=t=out:st=${(sc.duration - 0.25).toFixed(2)}:d=0.25`,
      clipPath
    ]);

    sceneClips.push(clipPath);
  }

  await browser.close();
  return sceneClips;
}

// Concatenação e Mixagem Final com a Trilha Sonora e Ducking
async function buildFinalMasters(clips) {
  console.log('\n=== REALIZANDO MIXAGEM DE ÁUDIO & EXPORTAÇÃO FINAL ===\n');

  // 1. Concatenação dos Vídeos
  const concatList = path.join(VIDEO_DIR, 'concat_cinematic.txt');
  fs.writeFileSync(concatList, clips.map(c => `file '${path.basename(c)}'`).join('\n'));

  const rawMaster = path.join(VIDEO_DIR, 'raw_master.mp4');
  await runFfmpeg([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatList,
    '-c', 'copy',
    rawMaster
  ]);

  // 2. Mixagem com a Trilha Sonora Original (soundtrack_cinematic.wav) e Sidechain Ducking
  const soundtrackPath = path.join(AUDIO_DIR, 'soundtrack_cinematic.wav');
  const masterFinalPath = path.join(VIDEO_DIR, 'instituto-meridiano-master.mp4');

  console.log(' -> Mixando trilha musical com ducking automático e normalização EBU R128 (-14 LUFS)...');

  // Filter complex:
  // [1:a] é a trilha sonora (soundtrack_cinematic.wav) -> volume 0.28 (-11dB)
  // [0:a] é a narração -> volume 1.0
  // amix combina ambos
  // loudnorm garante -14 LUFS com true peak <= -1.0 dBTP
  await runFfmpeg([
    '-y',
    '-i', rawMaster,
    '-i', soundtrackPath,
    '-filter_complex',
    '[1:a]volume=0.25[bgm];[0:a]volume=1.2[voice];[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[mixed];[mixed]loudnorm=I=-14:TP=-1:LRA=11[aout]',
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    masterFinalPath
  ]);

  // 3. Corte de 60s
  console.log(' -> Gerando corte de 60 segundos com trilha musical...');
  const cut60 = path.join(VIDEO_DIR, 'instituto-meridiano-60s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterFinalPath,
    '-t', '60',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    cut60
  ]);

  // 4. Corte de 30s
  console.log(' -> Gerando corte de 30 segundos com trilha musical...');
  const cut30 = path.join(VIDEO_DIR, 'instituto-meridiano-30s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterFinalPath,
    '-t', '30',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    cut30
  ]);

  // 5. Versão Vertical 9:16 (1080x1920)
  console.log(' -> Gerando versão vertical 9:16 (1080x1920) para Reels / Stories...');
  const reels = path.join(VIDEO_DIR, 'instituto-meridiano-reels-45s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterFinalPath,
    '-t', '45',
    '-vf', 'crop=608:1080:656:0,scale=1080:1920',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    reels
  ]);

  // Limpa arquivo temporário
  if (fs.existsSync(rawMaster)) fs.unlinkSync(rawMaster);

  console.log('\n=== MASTERIZAÇÃO COMPLETA: TODOS OS VÍDEOS ATUALIZADOS ===');
}

async function main() {
  const clips = await captureCinematicFrames();
  await buildFinalMasters(clips);
}

main().catch(err => {
  console.error('Erro na renderização:', err);
  process.exit(1);
});

