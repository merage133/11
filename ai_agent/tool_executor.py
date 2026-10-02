"""
Выполнение инструментов для AI агента
"""
import os
import subprocess
import webbrowser
import logging
from pathlib import Path
from typing import Dict, Any
from duckduckgo_search import DDGS

from utils import (
    get_workspace_dir,
    is_path_safe,
    truncate_output,
    load_memory,
    save_memory,
    get_current_time,
    safe_eval
)

logger = logging.getLogger(__name__)


class ToolExecutor:
    """Класс для выполнения инструментов"""
    
    def __init__(self):
        """Инициализация исполнителя инструментов"""
        self.workspace = get_workspace_dir()
        self.max_output_length = 2000
        
    def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Выполняет инструмент с заданными аргументами
        
        Args:
            tool_name: Название инструмента
            arguments: Аргументы инструмента
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            # Маппинг инструментов на методы
            tool_methods = {
                'write_file': self.write_file,
                'read_file': self.read_file,
                'list_files': self.list_files,
                'run_command': self.run_command,
                'search_internet': self.search_internet,
                'get_current_time': self.get_current_time,
                'calculate': self.calculate,
                'save_memory': self.save_memory,
                'get_memory': self.get_memory,
                'get_system_info': self.get_system_info,
                'open_url': self.open_url
            }
            
            if tool_name not in tool_methods:
                return {
                    'success': False,
                    'error': f'Неизвестный инструмент: {tool_name}'
                }
            
            # Выполняем инструмент
            method = tool_methods[tool_name]
            return method(**arguments)
            
        except Exception as e:
            logger.error(f"Ошибка выполнения инструмента {tool_name}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def write_file(self, path: str, content: str) -> Dict[str, Any]:
        """
        Записывает файл в рабочую область
        
        Args:
            path: Путь к файлу (относительный)
            content: Содержимое файла
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            # Проверяем безопасность пути
            full_path = self.workspace / path
            
            if not is_path_safe(str(full_path), self.workspace):
                return {
                    'success': False,
                    'error': f'Путь вне рабочей области: {path}'
                }
            
            # Создаём директории если нужно
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Записываем файл
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                'success': True,
                'result': f'Файл записан: {path} ({len(content)} символов)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка записи файла: {str(e)}'
            }
    
    def read_file(self, path: str) -> Dict[str, Any]:
        """
        Читает файл из рабочей области
        
        Args:
            path: Путь к файлу (относительный)
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            # Проверяем безопасность пути
            full_path = self.workspace / path
            
            if not is_path_safe(str(full_path), self.workspace):
                return {
                    'success': False,
                    'error': f'Путь вне рабочей области: {path}'
                }
            
            if not full_path.exists():
                return {
                    'success': False,
                    'error': f'Файл не найден: {path}'
                }
            
            # Читаем файл
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Усекаем если слишком длинный
            content = truncate_output(content, self.max_output_length)
            
            return {
                'success': True,
                'result': content
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка чтения файла: {str(e)}'
            }
    
    def list_files(self, directory: str = ".") -> Dict[str, Any]:
        """
        Получает список файлов в директории
        
        Args:
            directory: Путь к директории (относительный)
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            # Проверяем безопасность пути
            full_path = self.workspace / directory
            
            if not is_path_safe(str(full_path), self.workspace):
                return {
                    'success': False,
                    'error': f'Путь вне рабочей области: {directory}'
                }
            
            if not full_path.exists():
                return {
                    'success': False,
                    'error': f'Директория не найдена: {directory}'
                }
            
            if not full_path.is_dir():
                return {
                    'success': False,
                    'error': f'Не является директорией: {directory}'
                }
            
            # Получаем список файлов
            files = []
            for item in full_path.iterdir():
                item_type = "📁" if item.is_dir() else "📄"
                size = ""
                if item.is_file():
                    size = f" ({item.stat().st_size} bytes)"
                files.append(f"{item_type} {item.name}{size}")
            
            if not files:
                return {
                    'success': True,
                    'result': 'Директория пуста'
                }
            
            return {
                'success': True,
                'result': '\n'.join(files)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка получения списка файлов: {str(e)}'
            }
    
    def run_command(self, command: str) -> Dict[str, Any]:
        """
        Выполняет команду в терминале
        
        Args:
            command: Команда для выполнения
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            # Проверяем опасные команды
            dangerous_commands = ['rm -rf /', 'format', 'del /f /q', 'mkfs']
            for dangerous in dangerous_commands:
                if dangerous in command.lower():
                    return {
                        'success': False,
                        'error': f'Опасная команда заблокирована: {dangerous}'
                    }
            
            # Выполняем команду с таймаутом
            result = subprocess.run(
                command,
                shell=True,
                cwd=str(self.workspace),
                capture_output=True,
                text=True,
                timeout=15,
                encoding='utf-8',
                errors='replace'
            )
            
            # Формируем отчёт
            stdout = truncate_output(result.stdout, self.max_output_length)
            stderr = truncate_output(result.stderr, self.max_output_length)
            
            report = f"""=== ОТЧЕТ О ВЫПОЛНЕНИИ КОМАНДЫ ===
Команда: {command}
Рабочая папка: {self.workspace}
Статус: {'✅ УСПЕХ' if result.returncode == 0 else '❌ ОШИБКА'}
Exit Code: {result.returncode}

--- STDOUT (Вывод программы) ---
{stdout or '(пусто)'}

--- STDERR (Ошибки) ---
{stderr or '(пусто)'}

ИНСТРУКЦИЯ ДЛЯ AI:
Если статус 'ОШИБКА', ты ОБЯЗАН проанализировать раздел STDERR,
исправить код с помощью write_file и запустить команду снова.
Не отвечай пользователю, пока не исправишь ошибку (максимум 3 попытки).
================================"""
            
            return {
                'success': result.returncode == 0,
                'result': report,
                'exit_code': result.returncode,
                'stdout': stdout,
                'stderr': stderr
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Команда прервана по таймауту (15 секунд)'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка выполнения команды: {str(e)}'
            }
    
    def search_internet(self, query: str) -> Dict[str, Any]:
        """
        Ищет информацию в интернете через DuckDuckGo
        
        Args:
            query: Поисковый запрос
            
        Returns:
            Dict: Результат поиска
        """
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
            
            if not results:
                return {
                    'success': True,
                    'result': 'Ничего не найдено'
                }
            
            # Форматируем результаты
            formatted = []
            for i, result in enumerate(results, 1):
                formatted.append(f"{i}. {result['title']}\n   {result['body']}\n   URL: {result['href']}")
            
            return {
                'success': True,
                'result': '\n\n'.join(formatted)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка поиска: {str(e)}'
            }
    
    def get_current_time(self) -> Dict[str, Any]:
        """
        Получает текущее время и дату
        
        Returns:
            Dict: Результат выполнения
        """
        try:
            current_time = get_current_time()
            return {
                'success': True,
                'result': f'Текущее время: {current_time}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка получения времени: {str(e)}'
            }
    
    def calculate(self, expression: str) -> Dict[str, Any]:
        """
        Вычисляет математическое выражение
        
        Args:
            expression: Математическое выражение
            
        Returns:
            Dict: Результат вычисления
        """
        try:
            result = safe_eval(expression)
            
            if result['success']:
                return {
                    'success': True,
                    'result': f'{expression} = {result["result"]}'
                }
            else:
                return {
                    'success': False,
                    'error': result['error']
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка вычисления: {str(e)}'
            }
    
    def save_memory(self, key: str, value: str) -> Dict[str, Any]:
        """
        Сохраняет данные в долговременную память
        
        Args:
            key: Ключ для сохранения
            value: Значение для сохранения
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            memory = load_memory()
            memory[key] = value
            
            if save_memory(memory):
                return {
                    'success': True,
                    'result': f'Сохранено: {key} = {value}'
                }
            else:
                return {
                    'success': False,
                    'error': 'Ошибка сохранения в файл'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка сохранения: {str(e)}'
            }
    
    def get_memory(self, key: str) -> Dict[str, Any]:
        """
        Получает данные из долговременной памяти
        
        Args:
            key: Ключ для получения
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            memory = load_memory()
            
            if key in memory:
                return {
                    'success': True,
                    'result': f'{key} = {memory[key]}'
                }
            else:
                return {
                    'success': False,
                    'error': f'Ключ "{key}" не найден в памяти'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка получения: {str(e)}'
            }
    
    def get_system_info(self) -> Dict[str, Any]:
        """
        Получает информацию о системе
        
        Returns:
            Dict: Результат выполнения
        """
        try:
            import psutil
            
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # RAM
            memory = psutil.virtual_memory()
            memory_total_gb = memory.total / (1024**3)
            memory_available_gb = memory.available / (1024**3)
            memory_percent = memory.percent
            
            # Disk
            disk = psutil.disk_usage('/')
            disk_total_gb = disk.total / (1024**3)
            disk_free_gb = disk.free / (1024**3)
            disk_percent = disk.percent
            
            info = f"""=== ИНФОРМАЦИЯ О СИСТЕМЕ ===

CPU:
  Загрузка: {cpu_percent}%
  Ядер: {cpu_count}

RAM:
  Всего: {memory_total_gb:.1f} GB
  Свободно: {memory_available_gb:.1f} GB
  Используется: {memory_percent}%

Диск:
  Всего: {disk_total_gb:.1f} GB
  Свободно: {disk_free_gb:.1f} GB
  Используется: {disk_percent}%

=============================="""
            
            return {
                'success': True,
                'result': info
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'Модуль psutil не установлен. Установите: pip install psutil'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка получения информации: {str(e)}'
            }
    
    def open_url(self, url: str) -> Dict[str, Any]:
        """
        Открывает URL в браузере по умолчанию
        
        Args:
            url: URL для открытия
            
        Returns:
            Dict: Результат выполнения
        """
        try:
            webbrowser.open(url)
            return {
                'success': True,
                'result': f'Открыт URL: {url}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка открытия URL: {str(e)}'
            }
