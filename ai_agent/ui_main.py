"""
Главный интерфейс PyQt6 для AI агента
"""
import sys
import logging
from typing import Optional

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTextEdit, QLineEdit, QPushButton, QComboBox,
    QLabel, QStatusBar, QMessageBox, QSplitter, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer
from PyQt6.QtGui import QFont, QTextCursor

from llm_client import OllamaClient
from agent_loop import AgentLoop
from voice_input import VoiceInput

logger = logging.getLogger(__name__)


class AgentWorker(QThread):
    """Поток для выполнения задач агента"""
    
    finished = pyqtSignal(str)
    status_changed = pyqtSignal(str)
    tool_executed = pyqtSignal(str, dict)
    error = pyqtSignal(str)
    
    def __init__(self, agent: AgentLoop, user_input: str):
        super().__init__()
        self.agent = agent
        self.user_input = user_input
    
    def run(self):
        try:
            result = self.agent.process_task(self.user_input)
            self.finished.emit(result)
        except Exception as e:
            logger.error(f"Ошибка в потоке агента: {e}")
            self.error.emit(str(e))


class MainWindow(QMainWindow):
    """Главное окно приложения"""
    
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("AI Agent - Автономный AI помощник")
        self.setMinimumSize(1200, 800)
        
        # Инициализация компонентов
        self.ollama_client = OllamaClient()
        self.agent: Optional[AgentLoop] = None
        self.voice_input: Optional[VoiceInput] = None
        self.worker: Optional[AgentWorker] = None
        
        # Инициализация UI
        self._init_ui()
        
        # Загрузка моделей
        self._load_models()
        self._init_voice_input()
        
        # Проверка Ollama
        self._check_ollama()
    
    def _init_ui(self):
        """Инициализирует пользовательский интерфейс"""
        
        # Центральный виджет
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Главный layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        
        # Верхняя панель (выбор модели)
        top_panel = self._create_top_panel()
        main_layout.addWidget(top_panel)
        
        # Разделитель
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Левая панель (чат)
        left_panel = self._create_chat_panel()
        splitter.addWidget(left_panel)
        
        # Правая панель (лог инструментов)
        right_panel = self._create_tool_log_panel()
        splitter.addWidget(right_panel)
        
        # Устанавливаем размеры панелей
        splitter.setSizes([700, 500])
        
        main_layout.addWidget(splitter, stretch=1)
        
        # Нижняя панель (ввод)
        bottom_panel = self._create_input_panel()
        main_layout.addWidget(bottom_panel)
        
        # Статус-бар
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Готово")
        
        # Применяем тёмную тему
        self._apply_dark_theme()
    
    def _create_top_panel(self) -> QWidget:
        """Создаёт верхнюю панель с выбором модели"""
        panel = QWidget()
        layout = QHBoxLayout(panel)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Метка
        label = QLabel("Модель:")
        label.setStyleSheet("font-weight: bold;")
        layout.addWidget(label)
        
        # Выпадающий список моделей
        self.model_combo = QComboBox()
        self.model_combo.setMinimumWidth(300)
        self.model_combo.currentTextChanged.connect(self._on_model_changed)
        layout.addWidget(self.model_combo, stretch=1)
        
        # Кнопка обновления
        refresh_btn = QPushButton("🔄 Обновить")
        refresh_btn.clicked.connect(self._load_models)
        layout.addWidget(refresh_btn)
        
        # Кнопка очистки чата
        clear_btn = QPushButton("🗑️ Очистить чат")
        clear_btn.clicked.connect(self._clear_chat)
        layout.addWidget(clear_btn)
        
        return panel
    
    def _create_chat_panel(self) -> QWidget:
        """Создаёт панель чата"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Метка
        label = QLabel("💬 Чат с AI")
        label.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout.addWidget(label)
        
        # Текстовое поле для чата
        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        self.chat_display.setFont(QFont("Consolas", 10))
        layout.addWidget(self.chat_display)
        
        return panel
    
    def _create_tool_log_panel(self) -> QWidget:
        """Создаёт панель лога инструментов"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Метка
        label = QLabel("🔧 Лог инструментов")
        label.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout.addWidget(label)
        
        # Текстовое поле для лога
        self.tool_log = QTextEdit()
        self.tool_log.setReadOnly(True)
        self.tool_log.setFont(QFont("Consolas", 9))
        layout.addWidget(self.tool_log)
        
        return panel
    
    def _create_input_panel(self) -> QWidget:
        """Создаёт панель ввода"""
        panel = QWidget()
        layout = QHBoxLayout(panel)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Поле ввода
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Введите задачу или вопрос...")
        self.input_field.setFont(QFont("Consolas", 11))
        self.input_field.returnPressed.connect(self._send_message)
        layout.addWidget(self.input_field, stretch=1)
        
        # Кнопка голосового ввода
        self.voice_btn = QPushButton("🎤 Записать")
        self.voice_btn.setCheckable(True)
        self.voice_btn.clicked.connect(self._toggle_voice_input)
        self.voice_btn.setEnabled(False)  # Отключена если Vosk не загружен
        layout.addWidget(self.voice_btn)
        
        # Кнопка отправки
        self.send_btn = QPushButton("📨 Отправить")
        self.send_btn.clicked.connect(self._send_message)
        layout.addWidget(self.send_btn)
        
        return panel
    
    def _apply_dark_theme(self):
        """Применяет тёмную тему"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1e1e1e;
            }
            QWidget {
                background-color: #252526;
                color: #d4d4d4;
            }
            QTextEdit {
                background-color: #1e1e1e;
                color: #d4d4d4;
                border: 1px solid #3c3c3c;
                border-radius: 4px;
                padding: 5px;
            }
            QLineEdit {
                background-color: #3c3c3c;
                color: #d4d4d4;
                border: 1px solid #555555;
                border-radius: 4px;
                padding: 8px;
            }
            QPushButton {
                background-color: #0e639c;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1177bb;
            }
            QPushButton:pressed {
                background-color: #0d5689;
            }
            QPushButton:checked {
                background-color: #c72e2e;
            }
            QComboBox {
                background-color: #3c3c3c;
                color: #d4d4d4;
                border: 1px solid #555555;
                border-radius: 4px;
                padding: 5px;
            }
            QComboBox::drop-down {
                border: none;
            }
            QLabel {
                color: #d4d4d4;
            }
            QStatusBar {
                background-color: #007acc;
                color: white;
            }
        """)
    
    def _load_models(self):
        """Загружает список доступных моделей"""
        self.model_combo.clear()
        self.model_combo.addItem("Загрузка...")
        
        models = self.ollama_client.get_models()
        
        self.model_combo.clear()
        
        if models:
            self.model_combo.addItems(models)
            self.status_bar.showMessage(f"Загружено {len(models)} моделей")
        else:
            self.model_combo.addItem("Нет доступных моделей")
            self.status_bar.showMessage("Нет доступных моделей")
    
    def _init_voice_input(self):
        """Инициализирует голосовой ввод"""
        self.voice_input = VoiceInput(
            on_transcription=self._on_voice_transcription
        )
        
        if self.voice_input.is_available():
            self.voice_btn.setEnabled(True)
            self.status_bar.showMessage("Голосовой ввод готов")
        else:
            error_msg = self.voice_input.get_error_message()
            self.status_bar.showMessage(f"Голосовой ввод недоступен: {error_msg}")
    
    def _check_ollama(self):
        """Проверяет доступность Ollama"""
        if not self.ollama_client.is_available():
            QMessageBox.critical(
                self,
                "Ошибка",
                "Ollama не запущена!\n\nЗапустите команду: ollama serve"
            )
            self.send_btn.setEnabled(False)
            self.input_field.setEnabled(False)
    
    def _on_model_changed(self, model_name: str):
        """Обработчик изменения модели"""
        if model_name and model_name != "Загрузка..." and model_name != "Нет доступных моделей":
            self._init_agent(model_name)
    
    def _init_agent(self, model: str):
        """Инициализирует агента с выбранной моделью"""
        self.agent = AgentLoop(
            model=model,
            on_status_change=self._on_status_change,
            on_tool_execute=self._on_tool_execute
        )
        logger.info(f"Агент инициализирован с моделью: {model}")
    
    def _on_status_change(self, status: str):
        """Обработчик изменения статуса"""
        self.status_bar.showMessage(status)
    
    def _on_tool_execute(self, tool_name: str, arguments: dict):
        """Обработчик выполнения инструмента"""
        timestamp = self._get_timestamp()
        log_entry = f"[{timestamp}] Вызов: {tool_name}\nАргументы: {arguments}\n\n"
        
        self.tool_log.append(log_entry)
        self.tool_log.moveCursor(QTextCursor.MoveOperation.End)
    
    def _send_message(self):
        """Отправляет сообщение агенту"""
        user_input = self.input_field.text().strip()
        
        if not user_input:
            return
        
        if not self.agent:
            QMessageBox.warning(
                self,
                "Предупреждение",
                "Выберите модель перед отправкой сообщения"
            )
            return
        
        # Добавляем сообщение в чат
        self._append_to_chat(f"👤 Вы: {user_input}\n")
        
        # Очищаем поле ввода
        self.input_field.clear()
        
        # Блокируем кнопки
        self.send_btn.setEnabled(False)
        self.input_field.setEnabled(False)
        
        # Запускаем поток агента
        self.worker = AgentWorker(self.agent, user_input)
        self.worker.finished.connect(self._on_agent_finished)
        self.worker.error.connect(self._on_agent_error)
        self.worker.start()
    
    def _on_agent_finished(self, result: str):
        """Обработчик завершения работы агента"""
        self._append_to_chat(f"🤖 AI: {result}\n\n")
        
        # Разблокируем кнопки
        self.send_btn.setEnabled(True)
        self.input_field.setEnabled(True)
        self.input_field.setFocus()
    
    def _on_agent_error(self, error: str):
        """Обработчик ошибки агента"""
        self._append_to_chat(f"❌ Ошибка: {error}\n\n")
        
        # Разблокируем кнопки
        self.send_btn.setEnabled(True)
        self.input_field.setEnabled(True)
    
    def _toggle_voice_input(self):
        """Переключает голосовой ввод"""
        if self.voice_btn.isChecked():
            # Начинаем запись
            if self.voice_input.start_recording():
                self.voice_btn.setText("⏹️ Остановить")
                self.status_bar.showMessage("🎤 Запись голоса...")
            else:
                self.voice_btn.setChecked(False)
                QMessageBox.warning(
                    self,
                    "Ошибка",
                    "Не удалось начать запись. Проверьте микрофон."
                )
        else:
            # Останавливаем запись
            self.voice_btn.setText("🎤 Записать")
            self.status_bar.showMessage("Обработка голоса...")
            
            result = self.voice_input.stop_recording()
            
            if result:
                self.input_field.setText(result)
                self.status_bar.showMessage("Голос распознан")
            else:
                self.status_bar.showMessage("Голос не распознан")
    
    def _on_voice_transcription(self, text: str):
        """Обработчик транскрипции голоса"""
        logger.info(f"Транскрипция: {text}")
    
    def _clear_chat(self):
        """Очищает чат"""
        reply = QMessageBox.question(
            self,
            "Подтверждение",
            "Очистить историю чата?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.chat_display.clear()
            self.tool_log.clear()
            
            if self.agent:
                self.agent.reset()
            
            self.status_bar.showMessage("Чат очищен")
    
    def _append_to_chat(self, text: str):
        """Добавляет текст в чат"""
        self.chat_display.append(text)
        self.chat_display.moveCursor(QTextCursor.MoveOperation.End)
    
    def _get_timestamp(self) -> str:
        """Получает текущую временную метку"""
        from datetime import datetime
        return datetime.now().strftime("%H:%M:%S")
    
    def closeEvent(self, event):
        """Обработчик закрытия окна"""
        # Останавливаем голосовой ввод если идет запись
        if self.voice_input and self.voice_input.is_recording:
            self.voice_input.stop_recording()
        
        # Останавливаем поток агента если работает
        if self.worker and self.worker.isRunning():
            self.worker.terminate()
            self.worker.wait()
        
        event.accept()
