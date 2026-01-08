
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export enum Emotion {
  Neutral = 'Neutral',
  Enthusiastic = 'Enthusiastic',
  Sad = 'Sad',
  Angry = 'Angry',
  Whispering = 'Whispering',
  Cheerful = 'Cheerful'
}

export enum Language {
  MandarinTW = 'Chinese (Taiwan)',
  EnglishUS = 'English (US)',
  Japanese = 'Japanese',
  Korean = 'Korean'
}

export enum FileFormat {
  WAV = 'WAV',
  MP3 = 'MP3'
}

export interface TTSConfig {
  text: string;
  voice: VoiceName;
  emotion: Emotion;
  language: Language;
  speed: number;
}

export interface GeneratedAudio {
  id: string;
  blob: Blob;
  url: string;
  srt: string;
  config: TTSConfig;
  duration: number;
  rawData: Uint8Array;
}
