import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_CACHE_DIR = path.join(__dirname, '../../audio_cache');

if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

export class TtsService {
  /**
   * Generates or retrieves cached audio file for a given text script and language.
   * Returns: { audioUrl, filePath, hash, provider }
   */
  static async synthesizeAdvisoryAudio(scriptText, language = 'ta') {
    const hash = crypto.createHash('md5').update(`${language}:${scriptText}`).digest('hex');
    const filename = `${hash}.wav`;
    const filePath = path.join(AUDIO_CACHE_DIR, filename);

    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:5001';
    const audioUrl = `${baseUrl}/api/audio/tts/${hash}`;

    if (fs.existsSync(filePath)) {
      return { audioUrl, filePath, hash, cached: true, provider: 'cache' };
    }

    const ttsProvider = process.env.TTS_PROVIDER || 'mock';
    const googleKey = process.env.GOOGLE_TTS_API_KEY;

    if (ttsProvider === 'google' && googleKey) {
      try {
        const langCode = language === 'ta' ? 'ta-IN' : 'en-IN';
        const res = await axios.post(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
          {
            input: { text: scriptText },
            voice: { languageCode: langCode, ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 8000 },
          },
          { timeout: 10000 }
        );

        if (res.data?.audioContent) {
          const buffer = Buffer.from(res.data.audioContent, 'base64');
          fs.writeFileSync(filePath, buffer);
          logger.info(`Synthesized Google Cloud TTS audio: ${filename}`);
          return { audioUrl, filePath, hash, cached: false, provider: 'google' };
        }
      } catch (err) {
        logger.warn('Google TTS failed, falling back to synthesized advisory audio:', err.message);
      }
    }

    // Synthesize a valid 8 kHz 16-bit mono PCM WAV file (alert chime tone followed by voice advisory pulse)
    const buffer = this.createSyntheticToneWav(3.0); // 3-second gentle chime waveform
    fs.writeFileSync(filePath, buffer);
    logger.info(`Generated synthesized mock audio waveform: ${filename}`);

    return {
      audioUrl,
      filePath,
      hash,
      cached: false,
      provider: 'mock',
    };
  }

  /**
   * Helper to create a valid standard RIFF WAV buffer at 8000 Hz 16-bit mono
   */
  static createSyntheticToneWav(durationSeconds = 3) {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Generate two-tone acoustic alert chime: 440 Hz (A4) and 880 Hz (A5)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = t < 1.0 ? 523.25 : t < 2.0 ? 659.25 : 783.99; // C5 -> E5 -> G5 chime chord
      const envelope = Math.exp(-2.5 * (t % 1.0)); // exponential decay per tone
      const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
      const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      buffer.writeInt16LE(int16, offset);
      offset += 2;
    }

    return buffer;
  }

  static getAudioFilePath(hash) {
    const filePath = path.join(AUDIO_CACHE_DIR, `${hash}.wav`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}
