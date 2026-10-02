"""
Клиент для работы с Ollama API
"""
import json
import re
import requests
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Системный промпт для AI агента
SYSTEM_PROMPT = """Ты — автономный AI-агент с возможностью выполнения кода и работы с файлами.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:

1. ПЕСОЧНИЦА: Все файлы создаются ТОЛЬКО в папке ./agent_workspace
   - Используй относительные пути: "script.py", "data.txt"
   - НИКОГДА не используй абсолютные пути или ".."

2. АВТОТЕСТИРОВАНИЕ КОДА:
   - После написания кода через write_file ОБЯЗАТЕЛЬНО запусти его через run_command
   - Проанализируй вывод (stdout) и ошибки (stderr)
   - Если есть ошибка (exit_code != 0 или stderr не пуст):
     * НЕ спрашивай пользователя
     * ПРОАНАЛИЗИРУЙ ошибку
     * ИСПРАВЬ код через write_file
     * ПОВТОРИ запуск через run_command
   - Повторяй до 3 попыток
   - Если после 3 попыток код не работает, сообщи пользователю о проблеме

3. ИНСТРУМЕНТЫ:
   Используй только предоставленные инструменты через tool_calls.
   НЕ пиши названия инструментов в тексте ответа.

4. БЕЗОПАСНОСТЬ:
   - НЕ выполняй опасные команды (rm -rf /, format, del /f /q)
   - НЕ модифицируй системные файлы
   - НЕ устанавливай пакеты без разрешения

5. ОТВЕТЫ:
   - Отвечай на русском языке
   - Будь краток и конкретен
   - При успехе покажи результат
   - При ошибке объясни проблему и как её исправить

ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
- write_file(path, content) - записать файл
- read_file(path) - прочитать файл
- list_files(directory) - список файлов
- run_command(command) - выполнить команду
- search_internet(query) - поиск в интернете
- get_current_time() - текущее время
- calculate(expression) - вычислить выражение
- save_memory(key, value) - сохранить в память
- get_memory(key) - получить из памяти
- get_system_info() - информация о системе
- open_url(url) - открыть URL"""


class OllamaClient:
    """Клиент для работы с Ollama API"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        """
        Инициализация клиента Ollama
        
        Args:
            base_url: URL Ollama API
        """
        self.base_url = base_url
        self.timeout = 120  # Таймаут для длинных ответов
        
    def is_available(self) -> bool:
        """
        Проверяет доступность Ollama
        
        Returns:
            bool: True если Ollama доступна
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama недоступна: {e}")
            return False
    
    def get_models(self) -> List[str]:
        """
        Получает список доступных моделей
        
        Returns:
            List[str]: Список названий моделей
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            response.raise_for_status()
            
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            return models
        except Exception as e:
            logger.error(f"Ошибка получения списка моделей: {e}")
            return []
    
    def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Отправляет запрос к Ollama API
        
        Args:
            messages: Список сообщений
            model: Название модели
            tools: Список инструментов (опционально)
            temperature: Температура генерации
            stream: Использовать потоковую генерацию
            
        Returns:
            Dict: Ответ от Ollama
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": 4096
            }
        }
        
        if tools:
            payload["tools"] = tools
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            if stream:
                # Потоковая генерация
                return self._parse_stream_response(response)
            else:
                # Обычный ответ
                return response.json()
                
        except requests.exceptions.Timeout:
            logger.error("Таймаут при запросе к Ollama")
            return {
                "error": "Таймаут запроса",
                "message": {
                    "role": "assistant",
                    "content": "Превышено время ожидания ответа от AI модели."
                }
            }
        except Exception as e:
            logger.error(f"Ошибка запроса к Ollama: {e}")
            return {
                "error": str(e),
                "message": {
                    "role": "assistant",
                    "content": f"Ошибка при обращении к AI модели: {str(e)}"
                }
            }
    
    def _parse_stream_response(self, response) -> Dict[str, Any]:
        """
        Парсит потоковый ответ от Ollama
        
        Args:
            response: Response объект от requests
            
        Returns:
            Dict: Собранный ответ
        """
        full_content = ""
        tool_calls = []
        
        for line in response.iter_lines():
            if not line:
                continue
            
            try:
                data = json.loads(line)
                
                # Собираем контент
                if 'message' in data and 'content' in data['message']:
                    full_content += data['message']['content']
                
                # Собираем tool_calls
                if 'message' in data and 'tool_calls' in data['message']:
                    tool_calls.extend(data['message']['tool_calls'])
                
                # Проверяем завершение
                if data.get('done', False):
                    break
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Ошибка парсинга JSON: {e}")
                continue
        
        return {
            "message": {
                "role": "assistant",
                "content": full_content,
                "tool_calls": tool_calls if tool_calls else None
            },
            "done": True
        }
    
    def parse_tool_calls(self, response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Парсит tool_calls из ответа Ollama.
        Обрабатывает невалидный JSON.
        
        Args:
            response: Ответ от Ollama
            
        Returns:
            List[Dict]: Список вызовов инструментов
        """
        message = response.get('message', {})
        tool_calls = message.get('tool_calls', [])
        
        if not tool_calls:
            return []
        
        parsed_calls = []
        
        for call in tool_calls:
            try:
                # Пытаемся распарсить напрямую
                if isinstance(call, dict):
                    parsed_calls.append(call)
                elif isinstance(call, str):
                    # Пытаемся распарсить JSON строку
                    parsed = json.loads(call)
                    parsed_calls.append(parsed)
            except json.JSONDecodeError:
                # Пытаемся извлечь JSON через regex
                logger.warning("Невалидный JSON в tool_call, пытаемся извлечь через regex")
                
                match = re.search(r'\{.*\}', call, re.DOTALL)
                if match:
                    try:
                        parsed = json.loads(match.group())
                        parsed_calls.append(parsed)
                    except json.JSONDecodeError:
                        logger.error(f"Не удалось распарсить tool_call: {call}")
                else:
                    logger.error(f"Не найден JSON в tool_call: {call}")
        
        return parsed_calls


def create_tools_definition() -> List[Dict]:
    """
    Создаёт определение инструментов для Ollama
    
    Returns:
        List[Dict]: Список определений инструментов
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": "Записать файл в рабочую область (./agent_workspace)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Путь к файлу (относительный, например: 'script.py')"
                        },
                        "content": {
                            "type": "string",
                            "description": "Содержимое файла"
                        }
                    },
                    "required": ["path", "content"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Прочитать файл из рабочей области",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Путь к файлу"
                        }
                    },
                    "required": ["path"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_files",
                "description": "Получить список файлов в директории",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "directory": {
                            "type": "string",
                            "description": "Путь к директории (по умолчанию: '.')",
                            "default": "."
                        }
                    },
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "run_command",
                "description": "Выполнить команду в терминале (таймаут 15 секунд)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Команда для выполнения"
                        }
                    },
                    "required": ["command"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_internet",
                "description": "Поиск информации в интернете через DuckDuckGo",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Поисковый запрос"
                        }
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_current_time",
                "description": "Получить текущее время и дату",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "calculate",
                "description": "Вычислить математическое выражение",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "Математическое выражение"
                        }
                    },
                    "required": ["expression"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "save_memory",
                "description": "Сохранить данные в долговременную память",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "description": "Ключ для сохранения"
                        },
                        "value": {
                            "type": "string",
                            "description": "Значение для сохранения"
                        }
                    },
                    "required": ["key", "value"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_memory",
                "description": "Получить данные из долговременной памяти",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "description": "Ключ для получения"
                        }
                    },
                    "required": ["key"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_system_info",
                "description": "Получить информацию о системе (CPU, RAM, диск)",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "open_url",
                "description": "Открыть URL в браузере по умолчанию",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "URL для открытия"
                        }
                    },
                    "required": ["url"]
                }
            }
        }
    ]
