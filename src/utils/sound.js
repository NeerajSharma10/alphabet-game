import { Audio } from 'expo-av';

// Simple sound system using expo-av
// We generate WAV buffers in-memory for game sounds (no external files needed)

const loaded = {};
let initialized = false;

// Generate a simple WAV buffer with a sine wave tone
function generateToneWav(frequency, duration, volume = 0.5, fadeOut = true) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequency * t) * volume;

    // Apply fade out
    if (fadeOut) {
      const fadeStart = 0.6;
      const progress = i / numSamples;
      if (progress > fadeStart) {
        sample *= 1 - (progress - fadeStart) / (1 - fadeStart);
      }
    }

    const val = Math.max(-1, Math.min(1, sample));
    view.setInt16(headerSize + i * 2, val * 32767, true);
  }

  return buffer;
}

// Generate a multi-tone sound (chord or sequence)
function generateMultiToneWav(tones, duration, volume = 0.4) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    let sample = 0;

    for (const tone of tones) {
      const { freq, start = 0, end = 1, vol = 1 } = tone;
      if (progress >= start && progress <= end) {
        const localProgress = (progress - start) / (end - start);
        const envelope = localProgress < 0.1
          ? localProgress / 0.1
          : 1 - Math.pow(localProgress, 2);
        sample += Math.sin(2 * Math.PI * freq * t) * vol * envelope;
      }
    }

    sample *= volume;
    const val = Math.max(-1, Math.min(1, sample));
    view.setInt16(headerSize + i * 2, val * 32767, true);
  }

  return buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function createSoundFromBuffer(buffer) {
  const base64 = arrayBufferToBase64(buffer);
  const uri = `data:audio/wav;base64,${base64}`;
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
  return sound;
}

export async function preloadSounds() {
  if (initialized) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Correct: bright ding (high C)
    const correctBuf = generateToneWav(1047, 0.15, 0.4);

    // Wrong: low buzz
    const wrongBuf = generateToneWav(220, 0.2, 0.3);

    // Curse: descending crash
    const curseBuf = generateMultiToneWav([
      { freq: 300, start: 0, end: 0.5, vol: 0.8 },
      { freq: 150, start: 0.2, end: 1.0, vol: 0.6 },
      { freq: 80, start: 0.4, end: 1.0, vol: 0.5 },
    ], 0.35, 0.35);

    // Combo up: ascending woosh
    const comboBuf = generateMultiToneWav([
      { freq: 523, start: 0, end: 0.4, vol: 0.7 },
      { freq: 659, start: 0.15, end: 0.6, vol: 0.8 },
      { freq: 784, start: 0.3, end: 0.8, vol: 0.9 },
      { freq: 1047, start: 0.5, end: 1.0, vol: 1.0 },
    ], 0.4, 0.3);

    // Win: victory chord
    const winBuf = generateMultiToneWav([
      { freq: 523, start: 0, end: 0.5, vol: 0.8 },
      { freq: 659, start: 0.15, end: 0.65, vol: 0.8 },
      { freq: 784, start: 0.3, end: 0.8, vol: 0.9 },
      { freq: 1047, start: 0.5, end: 1.0, vol: 1.0 },
    ], 0.8, 0.35);

    // Game over: dark descending
    const gameOverBuf = generateMultiToneWav([
      { freq: 440, start: 0, end: 0.4, vol: 0.7 },
      { freq: 330, start: 0.2, end: 0.6, vol: 0.6 },
      { freq: 220, start: 0.4, end: 0.8, vol: 0.5 },
      { freq: 110, start: 0.6, end: 1.0, vol: 0.4 },
    ], 0.6, 0.35);

    loaded.correct = await createSoundFromBuffer(correctBuf);
    loaded.wrong = await createSoundFromBuffer(wrongBuf);
    loaded.curse = await createSoundFromBuffer(curseBuf);
    loaded.comboUp = await createSoundFromBuffer(comboBuf);
    loaded.win = await createSoundFromBuffer(winBuf);
    loaded.gameOver = await createSoundFromBuffer(gameOverBuf);

    initialized = true;
  } catch (e) {
    console.warn('Sound preload failed:', e);
  }
}

export async function playSound(name) {
  try {
    const sound = loaded[name];
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {
    // Silent fail — sound is enhancement, not critical
  }
}
