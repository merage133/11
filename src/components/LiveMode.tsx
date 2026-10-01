import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useTTS } from '../hooks/useTTS';

interface LiveModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  voiceSettings: {
    voiceName: string;
    rate: number;
    pitch: number;
    volume: number;
    autoSpeak: boolean;
  };
  lastResponse?: string;
}

export const LiveMode: React.FC<LiveModeProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  voiceSettings,
  lastResponse,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    toggleListening,
    isSupported: voiceSupported,
  } = useVoice((finalText) => {
    if (finalText.trim()) {
      onSendMessage(finalText.trim());
    }
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
  } = useTTS({
    voiceName: voiceSettings.voiceName,
    rate: voiceSettings.rate,
    pitch: voiceSettings.pitch,
    volume: voiceSettings.volume,
  });

  // Озвучиваем последний ответ если включено autoSpeak
  useEffect(() => {
    if (lastResponse && voiceSettings.autoSpeak && !isSpeaking) {
      // Убираем markdown и специальные символы
      const cleanText = lastResponse
        .replace(/```[\s\S]*?```/g, '') // убираем блоки кода
        .replace(/`[^`]*`/g, '') // убираем инлайн код
        .replace(/\*\*([^*]+)\*\*/g, '$1') // убираем жирный
        .replace(/\*([^*]+)\*/g, '$1') // убираем курсив
        .replace(/#{1,6}\s+/g, '') // убираем заголовки
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // убираем ссылки
        .replace(/[-*+]\s+/g, '') // убираем списки
        .replace(/\n+/g, ' ') // заменяем переносы
        .trim();

      if (cleanText) {
        speak(cleanText);
      }
    }
  }, [lastResponse, voiceSettings.autoSpeak]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform z-50"
        onClick={() => setIsMinimized(false)}
        style={{
          animation: isSpeaking ? 'pulse 1s infinite' : undefined,
        }}
      >
        {isSpeaking ? (
          <Volume2 className="w-6 h-6 text-white" />
        ) : isListening ? (
          <Mic className="w-6 h-6 text-white animate-pulse" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed w-80 bg-bg-secondary border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="drag-handle flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent/10 to-purple/10 border-b border-border cursor-move">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green animate-pulse' : 'bg-text-muted'}`} />
          <span className="text-sm font-medium text-text-primary">Live Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Свернуть"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="text-center">
          {isSpeaking ? (
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-6 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-accent">Говорю...</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse" />
              <span className="text-sm text-green">Слушаю...</span>
            </div>
          ) : (
            <span className="text-sm text-text-muted">Нажмите микрофон для начала</span>
          )}
        </div>

        {/* Transcript */}
        {(transcript || interimTranscript) && (
          <div className="bg-bg-tertiary rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-sm text-text-primary">
              {transcript}
              {interimTranscript && (
                <span className="text-text-muted italic"> {interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {voiceSupported && (
            <button
              onClick={toggleListening}
              className={`p-4 rounded-full transition-all ${
                isListening
                  ? 'bg-red text-white hover:bg-red/80'
                  : 'bg-accent text-white hover:bg-accent/80'
              }`}
              title={isListening ? 'Остановить' : 'Начать'}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              }
            }}
            className={`p-3 rounded-full transition-all ${
              isSpeaking
                ? 'bg-purple text-white hover:bg-purple/80'
                : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
            title={isSpeaking ? 'Остановить озвучку' : 'Озвучка'}
          >
            {isSpeaking ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-text-muted">
          {voiceSettings.autoSpeak ? '🔊 Автоозвучка включена' : '🔇 Автоозвучка выключена'}
        </div>
      </div>
    </div>
  );
};
