"""
Вспомогательные функции для AI Agent
"""
import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_base_dir() -> Path:
    """
    Получает базовую директорию приложения.
    При запуске из exe использует директорию exe файла.
    При запуске из Python использует текущую директорию.
    """
    if getattr(sys, 'frozen', False):
        # Запущено как exe
        return Path(sys.executable).parent
    else:
        # Запущено как Python скрипт
        return Path(__file__).parent


def get_resource_path(relative_path: str) -> Path:
    """
    Получает путь к ресурсу (файлу или папке).
    Корректно работает как при запуске из Python, так и из exe.
    
    Args:
        relative_path: Относительный путь к ресурсу
        
    Returns:
        Path: Абсолютный путь к ресурсу
    """
    if getattr(sys, 'frozen', False):
        # Запущено как exe - ресурсы в папке _MEIPASS
        base_path = Path(sys._MEIPASS)
    else:
        # Запущено как Python скрипт
        base_path = Path(__file__).parent
    
    return base_path / relative_path


def get_workspace_dir() -> Path:
    """
    Получает директорию рабочей области (песочницы).
    Создаёт папку если её нет.
    
    Returns:
        Path: Путь к рабочей области
    """
    workspace = get_base_dir() / "agent_workspace"
    workspace.mkdir(exist_ok=True)
    return workspace


def get_memory_path() -> Path:
    """
    Получает путь к файлу памяти.
    Использует APPDATA на Windows или ~/.config на Linux/Mac.
    
    Returns:
        Path: Путь к файлу памяти
    """
    if sys.platform == 'win32':
        # Windows: используем APPDATA
        appdata = os.environ.get('APPDATA')
        if appdata:
            memory_dir = Path(appdata) / "AIAgent"
        else:
            memory_dir = get_base_dir()
    else:
        # Linux/Mac: используем ~/.config
        memory_dir = Path.home() / ".config" / "AIAgent"
    
    memory_dir.mkdir(parents=True, exist_ok=True)
    return memory_dir / "memory.json"


def is_path_safe(path: str, workspace: Path) -> bool:
    """
    Проверяет безопасность пути (защита от path traversal).
    
    Args:
        path: Путь для проверки
        workspace: Рабочая область (песочница)
        
    Returns:
        bool: True если путь безопасен
    """
    try:
        # Преобразуем в абсолютный путь
        resolved = Path(path).resolve()
        
        # Проверяем что путь внутри workspace
        return resolved.is_relative_to(workspace.resolve())
    except (ValueError, OSError):
        return False


def truncate_output(text: str, max_length: int = 2000) -> str:
    """
    Усекает вывод если он слишком длинный.
    Сохраняет начало и конец вывода.
    
    Args:
        text: Текст для усечения
        max_length: Максимальная длина
        
    Returns:
        str: Усечённый текст
    """
    if len(text) <= max_length:
        return text
    
    # Сохраняем 500 символов в начале и 1500 в конце
    start = text[:500]
    end = text[-1500:]
    
    return f"{start}\n\n[...OUTPUT TRUNCATED...]\n\n{end}"


def load_memory() -> dict:
    """
    Загружает память из файла.
    
    Returns:
        dict: Словарь с данными памяти
    """
    memory_path = get_memory_path()
    
    if memory_path.exists():
        try:
            with open(memory_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Ошибка загрузки памяти: {e}")
            return {}
    
    return {}


def save_memory(data: dict) -> bool:
    """
    Сохраняет память в файл.
    
    Args:
        data: Данные для сохранения
        
    Returns:
        bool: True если успешно
    """
    memory_path = get_memory_path()
    
    try:
        with open(memory_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        logger.error(f"Ошибка сохранения памяти: {e}")
        return False


def get_current_time() -> str:
    """
    Получает текущее время и дату.
    
    Returns:
        str: Форматированная строка с временем
    """
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S (%A)")


def safe_eval(expression: str) -> dict:
    """
    Безопасно вычисляет математическое выражение.
    Запрещает опасные операции.
    
    Args:
        expression: Математическое выражение
        
    Returns:
        dict: Результат или ошибка
    """
    # Запрещённые слова
    forbidden = ['import', 'exec', 'eval', 'compile', '__', 'open', 'os', 'sys']
    
    # Проверяем наличие запрещённых слов
    for word in forbidden:
        if word in expression.lower():
            return {
                'success': False,
                'error': f'Запрещённая операция: {word}'
            }
    
    try:
        # Используем sympy для безопасных вычислений
        from sympy import sympify
        
        result = sympify(expression)
        
        return {
            'success': True,
            'result': str(result)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def format_tool_result(tool_name: str, result: dict) -> str:
    """
    Форматирует результат выполнения инструмента для отправки в LLM.
    
    Args:
        tool_name: Название инструмента
        result: Результат выполнения
        
    Returns:
        str: Отформатированный результат
    """
    if result.get('success'):
        return f"✅ Инструмент {tool_name} выполнен успешно:\n{result.get('result', '')}"
    else:
        return f"❌ Ошибка при выполнении {tool_name}:\n{result.get('error', 'Неизвестная ошибка')}"
