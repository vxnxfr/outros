/**
 * SINTETIZADOR DE TRILHA SONORA CINEMATOGRÁFICA ORIGINAL (ROYALTY-FREE / CC0)
 * Gera um arquivo WAV estéreo de 44.1kHz com batida eletrônica downtempo (116 BPM),
 * sub-bass analógico, pads atmosféricos e arpeggios cintilantes.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SEC = 120; // 2 minutos de música completa
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SEC;
const BPM = 116;
const BEAT_LEN = (60 / BPM) * SAMPLE_RATE;

// Buffer de Áudio Estéreo
const leftChannel = new Float32Array(TOTAL_SAMPLES);
const rightChannel = new Float32Array(TOTAL_SAMPLES);

// 1. Progressão Harmônica (A minor -> F major -> D minor -> Em7)
const chords = [
  [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
  [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
  [146.83, 220.00, 261.63, 349.23], // Dm7 (D3, A3, C4, F4)
  [164.81, 196.00, 246.94, 329.63]  // Em7 (E3, G3, B3, E4)
];

const bassNotes = [55.00, 43.65, 36.71, 41.20]; // A1, F1, D1, E1

console.log('Sintetizando trilha sonora cinematográfica (116 BPM)...');

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const currentMeasure = Math.floor(t / ((60 / BPM) * 4));
  const chordIdx = currentMeasure % chords.length;
  const chord = chords[chordIdx];
  const bassFreq = bassNotes[chordIdx];

  let l = 0;
  let r = 0;

  // --- A. BASS SUB-ANALOG (Onda Triangular + Senoidal saturada) ---
  const bassWave = Math.sin(2 * Math.PI * bassFreq * t) * 0.22 +
                   Math.sin(4 * Math.PI * bassFreq * t) * 0.08;
  l += bassWave;
  r += bassWave;

  // --- B. CHORD PADS (Lush Warm Atmospheric Synth) ---
  const padLFO = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.2 * t);
  for (let c = 0; c < chord.length; c++) {
    const f = chord[c];
    // Detune estéreo sutil para abertura espacial
    const noteL = Math.sin(2 * Math.PI * (f - 0.5) * t);
    const noteR = Math.sin(2 * Math.PI * (f + 0.5) * t);
    const vol = 0.04 * padLFO;
    l += noteL * vol;
    r += noteR * vol;
  }

  // --- C. ARPEGGIO CINTILANTE (16th notes) ---
  const sixteenth = Math.floor(t / (60 / BPM / 4));
  const arpNoteIdx = sixteenth % chord.length;
  const arpF = chord[arpNoteIdx] * 2; // Oitava acima
  const sixteenthTime = (t % (60 / BPM / 4)) / (60 / BPM / 4);
  const arpEnv = Math.exp(-sixteenthTime * 8); // Decay percussivo
  const arpTone = Math.sin(2 * Math.PI * arpF * t) * arpEnv * 0.035;
  l += arpTone * 0.8;
  r += arpTone * 1.2;

  // --- D. BEAT / RITMO DOWNTEMPO ---
  const beatProgress = (i % Math.floor(BEAT_LEN)) / BEAT_LEN;
  const beatIdx = Math.floor(t / (60 / BPM)) % 4; // 0, 1, 2, 3

  // Kick (Beats 0 e 2)
  if (beatIdx === 0 || beatIdx === 2) {
    if (beatProgress < 0.2) {
      const kickFreq = 120 * Math.exp(-beatProgress * 25) + 45;
      const kickEnv = Math.exp(-beatProgress * 14);
      const kick = Math.sin(2 * Math.PI * kickFreq * (beatProgress * BEAT_LEN / SAMPLE_RATE)) * kickEnv * 0.35;
      l += kick;
      r += kick;
    }
  }

  // Soft Snare / Rim (Beats 1 e 3)
  if (beatIdx === 1 || beatIdx === 3) {
    if (beatProgress < 0.25) {
      const snareEnv = Math.exp(-beatProgress * 18);
      const noise = (Math.random() * 2 - 1) * 0.12 * snareEnv;
      const tone = Math.sin(2 * Math.PI * 180 * beatProgress) * 0.08 * snareEnv;
      l += (noise + tone) * 0.9;
      r += (noise + tone) * 1.1;
    }
  }

  // Hi-Hats em semicolcheias sutis
  const hatProgress = (i % Math.floor(BEAT_LEN / 4)) / (BEAT_LEN / 4);
  if (hatProgress < 0.1) {
    const hatEnv = Math.exp(-hatProgress * 35);
    const hat = (Math.random() * 2 - 1) * 0.04 * hatEnv;
    l += hat * 1.1;
    r += hat * 0.8;
  }

  // Fade in inicial e fade out final
  let masterEnv = 1;
  if (t < 3) masterEnv = t / 3;
  if (t > DURATION_SEC - 4) masterEnv = (DURATION_SEC - t) / 4;

  leftChannel[i] = Math.max(-0.95, Math.min(0.95, l * masterEnv));
  rightChannel[i] = Math.max(-0.95, Math.min(0.95, r * masterEnv));
}

// 2. Gravação de Arquivo WAV Estéreo 16-bit
function writeWavFile(filePath, left, right) {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = left.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // Header RIFF
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 para PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 para PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const sL = Math.floor(left[i] * 32767);
    const sR = Math.floor(right[i] * 32767);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sL)), offset);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sR)), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Trilha salva com sucesso em: ${filePath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

const outWav = path.join(__dirname, '..', 'video', 'audio', 'soundtrack_cinematic.wav');
writeWavFile(outWav, leftChannel, rightChannel);

