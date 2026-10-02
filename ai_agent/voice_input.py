"""
Голосовой ввод через Vosk
"""
import os
import json
import queue
import logging
import numpy as np
import sounddevice as sd
from pathlib import Path
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class VoiceInput:
    """Класс для голосового ввода через Vosk"""
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        sample_rate: int = 16000,
        on_transcription: Optional[Callable[[str], None]] = None
    ):
        """
        Инициализация голосового ввода
        
        Args:
            model_path: Путь к модели Vosk
            sample_rate: Частота дискретизации
            on_transcription: Callback при получении транскрипции
        """
        self.sample_rate = sample_rate
        self.on_transcription = on_transcription
        
        # Очередь для аудио данных
        self.audio_queue = queue.Queue()
        
        # Флаги состояния
        self.is_recording = False
        self.is_model_loaded = False
        
        # Vosk модель и recognizer
        self.model = None
        self.recognizer = None
        
        # Поток записи
        self.stream = None
        
        # Загружаем модель
        self._load_model(model_path)
    
    def _load_model(self, model_path: Optional[str] = None):
        """
        Загружает модель Vosk
        
        Args:
            model_path: Путь к модели (опционально)
        """
        try:
            from vosk import Model, KaldiRecognizer
            
            # Определяем путь к модели
            if model_path is None:
                # Ищем модель в стандартных местах
                possible_paths = [
                    Path("models/vosk-model-small-ru-0.22"),
                    Path("vosk-model-small-ru-0.22"),
                    Path.home() / ".vosk" / "vosk-model-small-ru-0.22"
                ]
                
                model_path = None
                for path in possible_paths:
                    if path.exists():
                        model_path = str(path)
                        break
                
                if model_path is None:
                    logger.error("Модель Vosk не найдена")
                    logger.info("Скачайте модель с https://alphacephei.com/vosk/models")
                    logger.info("и распакуйте в папку models/")
                    return
            
            # Загружаем модель
            logger.info(f"Загрузка модели Vosk из: {model_path}")
            self.model = Model(model_path)
            self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
            self.is_model_loaded = True
            logger.info("Модель Vosk успешно загружена")
            
        except ImportError:
            logger.error("Vosk не установлен. Установите: pip install vosk")
        except Exception as e:
            logger.error(f"Ошибка загрузки модели Vosk: {e}")
    
    def start_recording(self) -> bool:
        """
        Начинает запись с микрофона
        
        Returns:
            bool: True если запись начата успешно
        """
        if not self.is_model_loaded:
            logger.error("Модель Vosk не загружена")
            return False
        
        if self.is_recording:
            logger.warning("Запись уже идет")
            return False
        
        try:
            # Очищаем очередь
            while not self.audio_queue.empty():
                self.audio_queue.get()
            
            # Открываем поток записи
            self.stream = sd.RawInputStream(
                samplerate=self.sample_rate,
                blocksize=8000,
                dtype='int16',
                channels=1,
                callback=self._audio_callback
            )
            
            self.stream.start()
            self.is_recording = True
            logger.info("Запись начата")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка начала записи: {e}")
            return False
    
    def stop_recording(self) -> Optional[str]:
        """
        Останавливает запись и возвращает транскрипцию
        
        Returns:
            Optional[str]: Транскрибированный текст или None
        """
        if not self.is_recording:
            logger.warning("Запись не идет")
            return None
        
        try:
            # Останавливаем поток
            self.stream.stop()
            self.stream.close()
            self.stream = None
            self.is_recording = False
            logger.info("Запись остановлена")
            
            # Получаем финальный результат
            return self._get_final_result()
            
        except Exception as e:
            logger.error(f"Ошибка остановки записи: {e}")
            return None
    
    def _audio_callback(self, indata, frames, time, status):
        """
        Callback для обработки аудио данных
        
        Args:
            indata: Входные данные
            frames: Количество фреймов
            time: Время
            status: Статус
        """
        if status:
            logger.warning(f"Статус записи: {status}")
        
        # Добавляем данные в очередь
        self.audio_queue.put(bytes(indata))
    
    def _get_final_result(self) -> Optional[str]:
        """
        Получает финальный результат распознавания
        
        Returns:
            Optional[str]: Транскрибированный текст
        """
        if not self.recognizer:
            return None
        
        full_text = []
        
        # Обрабатываем все данные из очереди
        while not self.audio_queue.empty():
            data = self.audio_queue.get()
            
            if self.recognizer.AcceptWaveform(data):
                result = json.loads(self.recognizer.Result())
                text = result.get('text', '').strip()
                if text:
                    full_text.append(text)
        
        # Получаем финальный результат
        final_result = json.loads(self.recognizer.FinalResult())
        final_text = final_result.get('text', '').strip()
        
        if final_text:
            full_text.append(final_text)
        
        # Объединяем все части
        complete_text = ' '.join(full_text).strip()
        
        if complete_text:
            logger.info(f"Распознанный текст: {complete_text}")
            
            # Вызываем callback если есть
            if self.on_transcription:
                self.on_transcription(complete_text)
            
            return complete_text
        
        return None
    
    def is_available(self) -> bool:
        """
        Проверяет доступность голосового ввода
        
        Returns:
            bool: True если голосовой ввод доступен
        """
        return self.is_model_loaded
    
    def get_error_message(self) -> str:
        """
        Получает сообщение об ошибке если голосовой ввод недоступен
        
        Returns:
            str: Сообщение об ошибке
        """
        if not self.is_model_loaded:
            return "Модель Vosk не загружена. Скачайте модель с https://alphacephei.com/vosk/models"
        
        return ""


def list_audio_devices() -> list:
    """
    Получает список доступных аудио устройств
    
    Returns:
        list: Список устройств
    """
    try:
        devices = sd.query_devices()
        input_devices = []
        
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0:
                input_devices.append({
                    'id': i,
                    'name': device['name'],
                    'channels': device['max_input_channels'],
                    'sample_rate': device['default_samplerate']
                })
        
        return input_devices
        
    except Exception as e:
        logger.error(f"Ошибка получения списка устройств: {e}")
        return []
