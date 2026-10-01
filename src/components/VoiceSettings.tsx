import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Mic, Globe } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';

interface VoiceSettingsProps {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  autoSpeak: boolean;
  onChange: (settings: {
    voiceName: string;
    rate: number;
    pitch: number;
    volume: number;
    autoSpeak: boolean;
  }) => void;
}

// Предустановленные голоса с рекомендациями
const VOICE_PRESETS = [
  { name: 'Джарвис', description: 'Спокойный, профессиональный', rate: 0.9, pitch: 0.8 },
  { name: 'Рик Санчес', description: 'Энергичный, с хрипотцой', rate: 1.2, pitch: 0.6 },
  { name: 'Ассистент', description: 'Стандартный голос', rate: 1.0, pitch: 1.0 },
  { name: 'Быстрый', description: 'Ускоренная речь', rate: 1.5, pitch: 1.0 },
  { name: 'Медленный', description: 'Размеренная речь', rate: 0.7, pitch: 1.0 },
  { name: 'Высокий', description: 'Высокий тон', rate: 1.0, pitch: 1.5 },
  { name: 'Низкий', description: 'Низкий тон', rate: 1.0, pitch: 0.5 },
];

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceName,
  rate,
  pitch,
  volume,
  autoSpeak,
  onChange,
}) => {
  const [testText, setTestText] = useState('Привет! Я ваш AI-ассистент. Как я звучу?');
  
  const {
    speak,
    stop,
    isSpeaking,
    voices,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  } = useTTS({ voiceName, rate, pitch, volume });

  // Русские голоса
  const russianVoices = voices.filter(v => v.lang.startsWith('ru'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('ru'));

  const handlePresetClick = (preset: typeof VOICE_PRESETS[0]) => {
    // Пытаемся найти голос по имени
    let selectedVoice = voiceName;
    
    if (preset.name === 'Джарвис') {
      // Ищем низкий мужской голос
      const maleVoice = russianVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('мужской') ||
        v.name.toLowerCase().includes('yuri')
      );
      if (maleVoice) selectedVoice = maleVoice.name;
    } else if (preset.name === 'Рик Санчес') {
      // Ищем голос с характером
      const voice = russianVoices.find(v => 
        v.name.toLowerCase().includes('dmitry') || 
        v.name.toLowerCase().includes('pavel')
      );
      if (voice) selectedVoice = voice.name;
    }

    onChange({
      voiceName: selectedVoice,
      rate: preset.rate,
      pitch: preset.pitch,
      volume,
      autoSpeak,
    });
    setVoice(selectedVoice);
    setRate(preset.rate);
    setPitch(preset.pitch);
  };

  const handleTestVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(testText);
    }
  };

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <label className="text-sm font-medium text-text-primary block mb-3">
          <Volume2 className="w-4 h-4 inline mr-1.5" />
          Голосовые пресеты
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className={`p-3 rounded-lg border text-left transition-all ${
                voiceName === preset.name
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-text-muted bg-bg-tertiary'
              }`}
            >
              <div className="text-sm font-medium text-text-primary">{preset.name}</div>
              <div className="text-xs text-text-muted mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">
          Системный голос
        </label>
        <select
          value={voiceName}
          onChange={(e) => {
            setVoice(e.target.value);
            onChange({ voiceName: e.target.value, rate, pitch, volume, autoSpeak });
          }}
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
        >
          {russianVoices.length > 0 && (
            <optgroup label="Русские голоса">
              {russianVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </optgroup>
          )}
          {otherVoices.length > 0 && (
            <optgroup label="Другие голоса">
              {otherVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </optgroup>
          )}
          {voices.length === 0 && (
            <option value="">Голоса не найдены</option>
          )}
        </select>
        {voices.length === 0 && (
          <p className="text-xs text-text-muted mt-1.5">
            Голоса не обнаружены. Проверьте настройки TTS в системе.
          </p>
        )}
      </div>

      {/* Test Voice */}
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">
          Тест голоса
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
            placeholder="Текст для озвучки..."
          />
          <button
            onClick={handleTestVoice}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSpeaking
                ? 'bg-red/10 text-red hover:bg-red/20'
                : 'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            {isSpeaking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Скорость</label>
            <span className="text-sm text-accent code-font">{rate.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setRate(val);
              onChange({ voiceName, rate: val, pitch, volume, autoSpeak });
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Медленно</span>
            <span>Быстро</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Тон</label>
            <span className="text-sm text-accent code-font">{pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPitch(val);
              onChange({ voiceName, rate, pitch: val, volume, autoSpeak });
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Низкий</span>
            <span>Высокий</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Громкость</label>
            <span className="text-sm text-accent code-font">{volume.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              onChange({ voiceName, rate, pitch, volume: val, autoSpeak });
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Тихо</span>
            <span>Громко</span>
          </div>
        </div>
      </div>

      {/* Auto Speak */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border">
        <div>
          <div className="text-sm font-medium text-text-primary">Автоозвучка ответов</div>
          <div className="text-xs text-text-muted mt-0.5">
            Автоматически озвучивать ответы AI
          </div>
        </div>
        <button
          onClick={() => onChange({ voiceName, rate, pitch, volume, autoSpeak: !autoSpeak })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            autoSpeak ? 'bg-accent' : 'bg-bg-hover'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              autoSpeak ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
        <p className="text-xs text-text-secondary">
          <Globe className="w-3.5 h-3.5 inline mr-1" />
          Голоса зависят от вашей операционной системы. 
          Для дополнительных голосов установите языковые пакеты в настройках Windows/macOS.
        </p>
      </div>
    </div>
  );
};
