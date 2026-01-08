
import React, { useState, useRef } from 'react';
import { 
  Mic2, 
  Volume2, 
  Languages, 
  Settings2, 
  Download, 
  Play, 
  Pause, 
  FileText, 
  Sparkles,
  Loader2,
  Trash2,
  Music
} from 'lucide-react';
import { VoiceName, Emotion, Language, TTSConfig, GeneratedAudio } from './types';
import { ttsService } from './services/geminiService';
import { 
  decodeBase64, 
  decodeAudioToBuffer, 
  audioBufferToWav, 
  audioBufferToMp3,
  generateSRT 
} from './utils/audioUtils';

const App: React.FC = () => {
  const [text, setText] = useState('哈囉！我是 VibeVoice，這是一個超級活潑的語音生成器！快來試試看吧！');
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Kore);
  const [emotion, setEmotion] = useState<Emotion>(Emotion.Enthusiastic);
  const [language, setLanguage] = useState<Language>(Language.MandarinTW);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const config: TTSConfig = { text, voice, emotion, language, speed };
      const { audioBase64 } = await ttsService.generateSpeech(config);
      
      const rawData = decodeBase64(audioBase64);
      const audioBuffer = await decodeAudioToBuffer(rawData, audioContextRef.current);
      const wavBlob = audioBufferToWav(audioBuffer);
      const srt = generateSRT(text, audioBuffer.duration);

      const newResult: GeneratedAudio = {
        id: Date.now().toString(),
        blob: wavBlob,
        url: URL.createObjectURL(wavBlob),
        srt,
        config,
        duration: audioBuffer.duration,
        rawData // Keep raw PCM for MP3 encoding
      };

      setHistory(prev => [newResult, ...prev]);
    } catch (error) {
      console.error("Generation failed", error);
      alert("生成失敗，請檢查 API Key 或網路連線。");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMp3 = async (item: GeneratedAudio) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const buffer = await decodeAudioToBuffer(item.rawData, audioContextRef.current);
      const mp3Blob = audioBufferToMp3(buffer);
      downloadFile(mp3Blob, `voice_${item.id}.mp3`);
    } catch (e) {
      console.error("MP3 conversion failed", e);
      alert("MP3 轉換失敗，請稍後再試。");
    }
  };

  const downloadSRT = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    downloadFile(blob, filename);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-yellow-400 rounded-2xl shadow-lg transform -rotate-3 mb-4">
          <Sparkles className="w-8 h-8 text-white mr-2" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">VibeVoice AI</h1>
        </div>
        <p className="text-lg text-gray-600 font-medium">讓文字充滿靈魂，生成專屬你的活潑語音！</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input & Controls */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-white">
            <label className="block text-gray-700 font-bold mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              輸入文字
            </label>
            <textarea
              className="w-full h-40 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none text-lg text-gray-700 placeholder-gray-400"
              placeholder="想說什麼呢？"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-white grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center">
                <Volume2 className="w-5 h-5 mr-2 text-pink-500" />
                聲音人設
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none text-gray-700"
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceName)}
              >
                <option value={VoiceName.Kore}>Kore (活力男聲)</option>
                <option value={VoiceName.Puck}>Puck (熱情女聲)</option>
                <option value={VoiceName.Charon}>Charon (知性嗓音)</option>
                <option value={VoiceName.Fenrir}>Fenrir (低沈磁性)</option>
                <option value={VoiceName.Zephyr}>Zephyr (輕快明亮)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center">
                <Mic2 className="w-5 h-5 mr-2 text-orange-500" />
                語氣情感
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none text-gray-700"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as Emotion)}
              >
                <option value={Emotion.Enthusiastic}>熱情奔放</option>
                <option value={Emotion.Cheerful}>開心愉悅</option>
                <option value={Emotion.Neutral}>平靜自然</option>
                <option value={Emotion.Sad}>悲傷低落</option>
                <option value={Emotion.Angry}>生氣憤怒</option>
                <option value={Emotion.Whispering}>悄悄耳語</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center">
                <Languages className="w-5 h-5 mr-2 text-blue-500" />
                主要語言
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none text-gray-700"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value={Language.MandarinTW}>繁體中文 (台灣)</option>
                <option value={Language.EnglishUS}>English (US)</option>
                <option value={Language.Japanese}>日本語</option>
                <option value={Language.Korean}>한국어</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center">
                <Settings2 className="w-5 h-5 mr-2 text-green-500" />
                語速調整 ({speed}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${
              loading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>魔幻生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>立即生成語音</span>
              </>
            )}
          </button>
        </section>

        {/* Results / History */}
        <section className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center px-2">
            <Volume2 className="w-6 h-6 mr-2 text-indigo-500" />
            最近生成的語音
          </h2>
          
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center text-gray-500">
                尚未有生成的紀錄
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-4 shadow-md border-2 border-white hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.config.text}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">
                          {item.config.voice}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full font-bold">
                          {item.config.emotion}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold">
                          {item.duration.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteHistory(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <audio controls src={item.url} className="w-full h-10 mb-4 rounded-lg" />
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadFile(item.blob, `voice_${item.id}.wav`)}
                      className="flex-1 min-w-[90px] flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                    >
                      <Download className="w-3 h-3 mr-1" /> WAV
                    </button>
                    <button
                      onClick={() => handleDownloadMp3(item)}
                      className="flex-1 min-w-[90px] flex items-center justify-center py-2 px-3 bg-pink-50 text-pink-700 rounded-xl text-xs font-bold hover:bg-pink-100 transition-all"
                    >
                      <Music className="w-3 h-3 mr-1" /> MP3
                    </button>
                    <button
                      onClick={() => downloadSRT(item.srt, `subtitles_${item.id}.srt`)}
                      className="flex-1 min-w-[90px] flex items-center justify-center py-2 px-3 bg-yellow-50 text-yellow-700 rounded-xl text-xs font-bold hover:bg-yellow-100 transition-all"
                    >
                      <FileText className="w-3 h-3 mr-1" /> SRT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>© 2026 VibeVoice AI. Powered by Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
