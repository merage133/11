import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTTSOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseTTSReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  setVoice: (name: string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  currentVoice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(options.voiceName || '');
  const [rate, setRate] = useState(options.rate || 1);
  const [pitch, setPitch] = useState(options.pitch || 1);
  const [volume, setVolume] = useState(options.volume || 1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Загрузка голосов
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Если голос не выбран, выбираем первый русский
      if (!currentVoice && availableVoices.length > 0) {
        const russianVoice = availableVoices.find(v => v.lang.startsWith('ru'));
        if (russianVoice) {
          setCurrentVoice(russianVoice.name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [currentVoice]);

  const speak = useCallback((text: string) => {
    // Останавливаем предыдущее воспроизведение
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Устанавливаем голос
    if (currentVoice) {
      const voice = voices.find(v => v.name === currentVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = 'ru-RU';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [currentVoice, voices, rate, pitch, volume]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    voices,
    setVoice: setCurrentVoice,
    setRate,
    setPitch,
    setVolume,
    currentVoice,
    rate,
    pitch,
    volume,
  };
}
