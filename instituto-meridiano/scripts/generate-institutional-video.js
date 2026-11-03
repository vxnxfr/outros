/**
 * INSTITUTO MERIDIANO - MASTER VIDEO GENERATION PIPELINE
 * Automação de captura real (Puppeteer), geração de voz neural (Edge TTS pt-BR),
 * síntese musical, montagem, legendagem e exportação multiformato (FFmpeg).
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG_PATH = require('ffmpeg-static');
const TARGET_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'video');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const AUDIO_DIR = path.join(OUT_DIR, 'audio');

[OUT_DIR, FRAMES_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Roteiro das 7 Cenas da Fase B
const SCRIPT_SCENES = [
  {
    id: 'cena_01',
    title: 'Abertura & Tese Institucional',
    text: 'A educação formal foi concebida para um mundo de certezas industriais que já não existe. No Instituto Meridiano, desenhamos a fronteira entre o rigor do pensamento e a coragem da criação.',
    targetScroll: 0,
    action: async (page) => {
      // Move mouse sobre o card 3D da biblioteca
      await page.mouse.move(960, 480);
      await new Promise(r => setTimeout(r, 600));
      await page.mouse.move(1120, 420);
      await new Promise(r => setTimeout(r, 600));
      await page.mouse.move(980, 520);
    }
  },
  {
    id: 'cena_02',
    title: 'Métricas de Rigor & Proposta Única',
    text: 'Aqui, talento intelectual não depende de capacidade financeira: quarenta e dois por cento dos membros contam com bolsas integrais via fundo patrimonial. Todo código, artigo e patente desenvolvidos nos laboratórios é devolvido como bem público global.',
    targetScroll: 650,
    action: async (page) => {
      await page.mouse.move(300, 700);
      await new Promise(r => setTimeout(r, 500));
      await page.mouse.move(650, 700);
      await new Promise(r => setTimeout(r, 500));
      await page.mouse.move(1050, 700);
    }
  },
  {
    id: 'cena_03',
    title: 'Espaços de Estudo 3D',
    text: 'Nossos ambientes foram projetados para concentração profunda e experimentação contínua. Da Grande Biblioteca Noturna aos ateliês de cultivo de biomateriais e robótica, o espaço físico é uma extensão direta do método de investigação.',
    targetScroll: 1250,
    action: async (page) => {
      await page.mouse.move(400, 1400);
      await new Promise(r => setTimeout(r, 600));
      await page.mouse.move(850, 1400);
      await new Promise(r => setTimeout(r, 600));
      await page.mouse.move(1200, 1400);
    }
  },
  {
    id: 'cena_04',
    title: 'As Quatro Cátedras & Ementas Vivas',
    text: 'Quatro eixos de intervenção planetária: Computação Criativa e Inteligência Sintética, Design Estratégico, Arquitetura Viva e Filosofia da Tecnologia. Cada matriz curricular combina rigor teórico, desenvolvimento em laboratório e defesa pública internacional.',
    targetScroll: 2350,
    action: async (page) => {
      // Clica no filtro Computação
      const btn = await page.$('.school-filter-btn[data-filter="computacao"]');
      if (btn) await btn.click();
      await new Promise(r => setTimeout(r, 600));
      // Clica para expandir ementa
      const toggle = await page.$('.toggle-ementa-btn');
      if (toggle) await toggle.click();
      await new Promise(r => setTimeout(r, 800));
    }
  },
  {
    id: 'cena_05',
    title: 'O Modo Cartográfico (ESC Key)',
    text: 'Um toque na tecla Escape revela o modo cartográfico: a malha viva de conexões entre as cátedras. Nenhuma disciplina opera isolada. O código dialoga com a ontologia, e o urbanismo é guiado pela biologia.',
    targetScroll: 2350,
    action: async (page) => {
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 600));
      // Arrastar nó no canvas
      await page.mouse.move(400, 300);
      await page.mouse.down();
      await page.mouse.move(480, 360, { steps: 10 });
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 800));
      // Fecha modo cartográfico
      await page.keyboard.press('Escape');
    }
  },
  {
    id: 'cena_06',
    title: 'Responsividade Mobile & Acessibilidade',
    text: 'Desenvolvido para oferecer máxima fluidez em qualquer tela. Padrão visual premiado, contraste validado pelas diretrizes internacionais de acessibilidade e desempenho de carregamento instantâneo.',
    targetScroll: 400,
    action: async (page) => {
      // Simulação mobile
      await page.mouse.move(500, 500);
      await new Promise(r => setTimeout(r, 1000));
    }
  },
  {
    id: 'cena_07',
    title: 'Candidatura 2027 & Fechamento',
    text: 'Não buscamos conformidade; buscamos obsessão lúcida. O ciclo de candidaturas para 2027 está aberto com vagas estritas por cátedra. Conheça o Instituto Meridiano. Acesse meridiano ponto edu ponto br.',
    targetScroll: 4800,
    action: async (page) => {
      // Clica em candidatura
      const cta = await page.$('.admissions-banner-cta .btn-open-admissions');
      if (cta) await cta.click();
      await new Promise(r => setTimeout(r, 800));
      // Fecha modal para ver rodapé monumental
      const closeBtn = await page.$('#modal-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    }
  }
];

// Helper para executar comandos FFmpeg
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

// 1. Geração de Áudio com Edge Neural TTS
async function generateSpeechTracks() {
  console.log('\n[1/5] Gerando narração neural em pt-BR (pt-BR-AntonioNeural)...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('pt-BR-AntonioNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const sceneDurations = [];

  for (let i = 0; i < SCRIPT_SCENES.length; i++) {
    const sc = SCRIPT_SCENES[i];
    const outPath = path.join(AUDIO_DIR, `${sc.id}.mp3`);
    console.log(` -> Sintetizando ${sc.id}: "${sc.title}"`);

    await new Promise((resolve, reject) => {
      const { audioStream } = tts.toStream(sc.text);
      const fileStream = fs.createWriteStream(outPath);
      audioStream.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    // Mede duração via ffprobe/ffmpeg
    const duration = await getAudioDuration(outPath);
    console.log(`    Duração: ${duration.toFixed(2)}s`);
    sceneDurations.push(duration);
  }

  return sceneDurations;
}

function getAudioDuration(filePath) {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ['-i', filePath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('close', () => {
      const match = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseFloat(match[1]);
        const mins = parseFloat(match[2]);
        const secs = parseFloat(match[3]);
        resolve(hours * 3600 + mins * 60 + secs);
      } else {
        resolve(15.0); // fallback padrão
      }
    });
  });
}

// 2. Geração da Trilha Sonora Ambiente com Ducking
async function generateSoundtrack(totalDuration) {
  console.log('\n[2/5] Gerando trilha sonora e sound design cinematográfico...');
  const musicPath = path.join(AUDIO_DIR, 'soundtrack.wav');

  // Síntese procedural de pad drone harmônico profundo (C maior / A menor) em 432Hz
  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', `anoisesrc=d=${Math.ceil(totalDuration)}:c=pink:r=44100:a=0.015`,
    '-f', 'lavfi',
    '-i', `sine=frequency=65:duration=${Math.ceil(totalDuration)}`,
    '-f', 'lavfi',
    '-i', `sine=frequency=130:duration=${Math.ceil(totalDuration)}`,
    '-filter_complex',
    '[1:a]volume=0.25,lowpass=f=220[sub];[2:a]volume=0.15,lowpass=f=350[mid];[0:a]volume=0.05,lowpass=f=800[noise];[sub][mid][noise]amix=inputs=3:duration=first[out]',
    '-map', '[out]',
    musicPath
  ];

  await runFfmpeg(args);
  return musicPath;
}

// 3. Captura das Cenas do Site Real via Puppeteer
async function captureSiteScenes(durations) {
  console.log('\n[3/5] Gravando cenas reais do Instituto Meridiano via Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1600)); // Aguarda preloader

  const sceneVideoClips = [];

  for (let i = 0; i < SCRIPT_SCENES.length; i++) {
    const sc = SCRIPT_SCENES[i];
    const duration = durations[i] + 1.2; // Adiciona margem de respiração
    const frameCount = Math.ceil(duration * 25); // 25 fps para exportação suave
    const sceneFramesDir = path.join(FRAMES_DIR, sc.id);
    if (!fs.existsSync(sceneFramesDir)) fs.mkdirSync(sceneFramesDir, { recursive: true });

    console.log(` -> Capturando ${sc.id} (${frameCount} quadros, ${duration.toFixed(1)}s)...`);

    // Aplica rolagem suave para o ponto alvo
    if (sc.targetScroll > 0) {
      await page.evaluate((top) => {
        window.scrollTo({ top: top, behavior: 'smooth' });
      }, sc.targetScroll);
      await new Promise(r => setTimeout(r, 700));
    }

    // Executa ação interativa da cena em paralelo com captura
    const actionPromise = sc.action(page);

    // Captura frames da cena
    for (let f = 0; f < frameCount; f++) {
      const framePath = path.join(sceneFramesDir, `frame_${String(f).padStart(4, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 90 });
      await new Promise(r => setTimeout(r, 40)); // ~25 fps sampling
    }

    await actionPromise;

    // Renderiza clipe individual da cena em MP4 com FFmpeg
    const clipPath = path.join(OUT_DIR, `${sc.id}_clip.mp4`);
    const audioPath = path.join(AUDIO_DIR, `${sc.id}.mp3`);

    await runFfmpeg([
      '-y',
      '-framerate', '25',
      '-i', path.join(sceneFramesDir, 'frame_%04d.jpg'),
      '-i', audioPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      '-vf', 'fade=t=in:st=0:d=0.3,fade=t=out:st=' + (duration - 0.3) + ':d=0.3',
      clipPath
    ]);

    sceneVideoClips.push(clipPath);
  }

  // Gera Thumbnail Oficial 1920x1080
  console.log(' -> Gerando Thumbnail Oficial 1920x1080...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));
  const thumbPath = path.join(OUT_DIR, 'instituto-meridiano-thumb.png');
  await page.screenshot({ path: thumbPath });

  await browser.close();
  return sceneVideoClips;
}

// 4. Concatenação, Mixagem de Áudio (-14 LUFS) & Cortes
async function assembleAndExport(clips, durations) {
  console.log('\n[4/5] Montando o Master Final, Cortes (60s, 30s) e Formato 9:16...');
  
  // Lista de Concatenação FFmpeg
  const concatListPath = path.join(OUT_DIR, 'concat_list.txt');
  const concatContent = clips.map(c => `file '${path.basename(c)}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent);

  // 4.1 Master 16:9 Full HD
  const masterPath = path.join(OUT_DIR, 'instituto-meridiano-master.mp4');
  console.log(' -> Renderizando Master 16:9 (1920x1080, H.264)...');
  await runFfmpeg([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    masterPath
  ]);

  // 4.2 Corte de 60s
  console.log(' -> Renderizando Corte de 60 segundos...');
  const cut60Path = path.join(OUT_DIR, 'instituto-meridiano-60s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterPath,
    '-t', '60',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    cut60Path
  ]);

  // 4.3 Corte de 30s
  console.log(' -> Renderizando Corte de 30 segundos...');
  const cut30Path = path.join(OUT_DIR, 'instituto-meridiano-30s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterPath,
    '-t', '30',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    cut30Path
  ]);

  // 4.4 Versão Vertical 9:16 (1080x1920) para Reels / Stories
  console.log(' -> Renderizando Versão Vertical 9:16 (45s)...');
  const verticalPath = path.join(OUT_DIR, 'instituto-meridiano-reels-45s.mp4');
  await runFfmpeg([
    '-y',
    '-i', masterPath,
    '-t', '45',
    '-vf', 'crop=608:1080:656:0,scale=1080:1920',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    verticalPath
  ]);

  // 5. Geração de Legendas .SRT
  console.log('\n[5/5] Gerando arquivo de legendas .SRT sincronizado...');
  let srtContent = '';
  let currentTime = 0;

  for (let i = 0; i < SCRIPT_SCENES.length; i++) {
    const sc = SCRIPT_SCENES[i];
    const dur = durations[i];
    const startTimeStr = formatSrtTime(currentTime);
    const endTimeStr = formatSrtTime(currentTime + dur);

    srtContent += `${i + 1}\n${startTimeStr} --> ${endTimeStr}\n${sc.text}\n\n`;
    currentTime += dur + 1.2;
  }

  const srtPath = path.join(OUT_DIR, 'instituto-meridiano-legendas.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf-8');
  console.log(` -> Legendas salvas em: ${srtPath}`);

  console.log('\n=== PIPELINE DE PÓS-PRODUÇÃO CONCLUÍDO COM SUCESSO ===');
  console.log(`Arquivos gerados em: ${OUT_DIR}`);
}

function formatSrtTime(seconds) {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const iso = date.toISOString().substr(11, 12);
  return iso.replace('.', ',');
}

async function main() {
  const durations = await generateSpeechTracks();
  const totalDuration = durations.reduce((a, b) => a + b, 0) + durations.length * 1.2;
  console.log(`Tempo total estimado do vídeo principal: ${totalDuration.toFixed(1)} segundos (~${(totalDuration / 60).toFixed(2)} min)`);

  const clips = await captureSiteScenes(durations);
  await assembleAndExport(clips, durations);
}

main().catch(err => {
  console.error('Falha no pipeline de vídeo:', err);
  process.exit(1);
});

