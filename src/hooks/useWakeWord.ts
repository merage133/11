import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWakeWordOptions {
  wakeWord: string;
  onWake: () => void;
  enabled: boolean;
}

interface UseWakeWordReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  detectedWord: string | null;
}

export function useWakeWord({ wakeWord, onWake, enabled }: UseWakeWordOptions): UseWakeWordReturn {
  const [isListening, setIsListening] = useState(false);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastWakeTime = useRef<number>(0);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !enabled) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      // Проверяем wake word
      const wakeWordLower = wakeWord.toLowerCase();
      if (transcript.includes(wakeWordLower)) {
        const now = Date.now();
        // Защита от повторных срабатываний (3 секунды)
        if (now - lastWakeTime.current > 3000) {
          lastWakeTime.current = now;
          setDetectedWord(wakeWord);
          onWake();
          
          // Сбрасываем detected word через 2 секунды
          setTimeout(() => setDetectedWord(null), 2000);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Wake word error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Автоматически перезапускаем если всё ещё включено
      if (enabled && isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [SpeechRecognition, enabled, wakeWord, onWake, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Автоматический старт/стоп при изменении enabled
  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
    detectedWord,
  };
}
