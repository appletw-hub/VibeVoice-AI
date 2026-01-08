
import { TTSConfig } from "../types";
// @ts-ignore
import lamejs from 'lamejs';

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Creates a WAV blob from an AudioBuffer.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const sampleRate = buffer.sampleRate;
  let offset = 0;

  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
    offset += s.length;
  };

  writeString('RIFF');
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * 2 * numOfChan, true); offset += 4;
  view.setUint16(offset, numOfChan * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString('data');
  view.setUint32(offset, length - offset - 4, true); offset += 4;

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Creates an MP3 blob from an AudioBuffer using lamejs.
 */
export function audioBufferToMp3(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  // @ts-ignore
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];

  const left = buffer.getChannelData(0);
  const leftInt16 = new Int16Array(left.length);
  for (let i = 0; i < left.length; i++) {
    leftInt16[i] = left[i] < 0 ? left[i] * 0x8000 : left[i] * 0x7FFF;
  }

  let rightInt16: Int16Array | null = null;
  if (channels === 2) {
    const right = buffer.getChannelData(1);
    rightInt16 = new Int16Array(right.length);
    for (let i = 0; i < right.length; i++) {
      rightInt16[i] = right[i] < 0 ? right[i] * 0x8000 : right[i] * 0x7FFF;
    }
  }

  const sampleBlockSize = 1152;
  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf;
    if (channels === 2 && rightInt16) {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

export function generateSRT(text: string, duration: number): string {
  const lines = text.split(/([,.;!?\n，。！？\s]+)/).filter(s => s.trim().length > 0);
  if (lines.length === 0) return "";

  const timePerChar = duration / text.length;
  let srt = "";
  let currentTime = 0;

  lines.forEach((line, index) => {
    const lineDuration = line.length * timePerChar;
    const startTime = formatSRTTime(currentTime);
    const endTime = formatSRTTime(currentTime + lineDuration);

    srt += `${index + 1}\n${startTime} --> ${endTime}\n${line}\n\n`;
    currentTime += lineDuration;
  });

  return srt;
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
