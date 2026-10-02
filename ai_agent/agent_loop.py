"""
Логика ReAct цикла для AI агента
"""
import logging
from typing import List, Dict, Any, Callable, Optional

from llm_client import OllamaClient, SYSTEM_PROMPT, create_tools_definition
from tool_executor import ToolExecutor
from utils import format_tool_result

logger = logging.getLogger(__name__)


class AgentLoop:
    """Класс реализующий ReAct цикл с автоисправлением"""
    
    def __init__(
        self,
        model: str,
        ollama_url: str = "http://localhost:11434",
        max_iterations: int = 5,
        on_status_change: Optional[Callable[[str], None]] = None,
        on_tool_execute: Optional[Callable[[str, Dict], None]] = None
    ):
        """
        Инициализация агента
        
        Args:
            model: Название модели Ollama
            ollama_url: URL Ollama API
            max_iterations: Максимальное количество итераций
            on_status_change: Callback для изменения статуса
            on_tool_execute: Callback для выполнения инструмента
        """
        self.client = OllamaClient(ollama_url)
        self.executor = ToolExecutor()
        self.model = model
        self.max_iterations = max_iterations
        self.tools = create_tools_definition()
        
        self.on_status_change = on_status_change
        self.on_tool_execute = on_tool_execute
        
        # История сообщений
        self.messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
    
    def set_status(self, status: str):
        """Устанавливает статус выполнения"""
        if self.on_status_change:
            self.on_status_change(status)
    
    def process_task(self, user_input: str) -> str:
        """
        Обрабатывает задачу пользователя через ReAct цикл
        
        Args:
            user_input: Входные данные от пользователя
            
        Returns:
            str: Финальный ответ
        """
        # Добавляем сообщение пользователя
        self.messages.append({
            "role": "user",
            "content": user_input
        })
        
        iteration = 0
        
        while iteration < self.max_iterations:
            iteration += 1
            self.set_status(f"AI думает... (итерация {iteration}/{self.max_iterations})")
            
            logger.info(f"Итерация {iteration}: Отправляем запрос к LLM")
            
            # Отправляем запрос к LLM
            response = self.client.chat(
                messages=self.messages,
                model=self.model,
                tools=self.tools,
                temperature=0.7
            )
            
            # Проверяем наличие ошибок
            if 'error' in response:
                error_msg = response['error']
                logger.error(f"Ошибка от LLM: {error_msg}")
                return f"Ошибка: {error_msg}"
            
            # Получаем ответ от LLM
            message = response.get('message', {})
            content = message.get('content', '')
            tool_calls = self.client.parse_tool_calls(response)
            
            # Если нет tool_calls - это финальный ответ
            if not tool_calls:
                self.set_status("Готово")
                logger.info("Получен финальный ответ от LLM")
                
                # Добавляем ответ в историю
                self.messages.append({
                    "role": "assistant",
                    "content": content
                })
                
                return content
            
            # Есть tool_calls - выполняем их
            logger.info(f"Получено {len(tool_calls)} вызовов инструментов")
            
            # Добавляем сообщение с tool_calls в историю
            self.messages.append({
                "role": "assistant",
                "content": content,
                "tool_calls": tool_calls
            })
            
            # Выполняем каждый tool_call
            for tool_call in tool_calls:
                tool_name = tool_call.get('function', {}).get('name', '')
                arguments = tool_call.get('function', {}).get('arguments', {})
                
                self.set_status(f"Выполняется: {tool_name}")
                logger.info(f"Выполняем инструмент: {tool_name}")
                
                # Вызываем callback если есть
                if self.on_tool_execute:
                    self.on_tool_execute(tool_name, arguments)
                
                # Выполняем инструмент
                result = self.executor.execute(tool_name, arguments)
                
                # Форматируем результат
                formatted_result = format_tool_result(tool_name, result)
                
                logger.info(f"Результат: {formatted_result[:200]}...")
                
                # Добавляем результат в историю как сообщение от tool
                self.messages.append({
                    "role": "tool",
                    "content": formatted_result
                })
        
        # Достигли лимита итераций
        self.set_status("Достигнут лимит итераций")
        logger.warning(f"Достигнут лимит итераций: {self.max_iterations}")
        
        # Добавляем сообщение о достижении лимита
        self.messages.append({
            "role": "user",
            "content": f"Ты достиг лимита в {self.max_iterations} итераций. Подведи итог: что удалось сделать, какие проблемы остались?"
        })
        
        # Получаем финальный ответ
        response = self.client.chat(
            messages=self.messages,
            model=self.model,
            tools=None,  # Без инструментов для финального ответа
            temperature=0.7
        )
        
        final_answer = response.get('message', {}).get('content', 'Не удалось получить ответ')
        
        self.messages.append({
            "role": "assistant",
            "content": final_answer
        })
        
        return final_answer
    
    def reset(self):
        """Сбрасывает историю сообщений"""
        self.messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        logger.info("История сообщений сброшена")
    
    def get_history(self) -> List[Dict[str, Any]]:
        """
        Получает текущую историю сообщений
        
        Returns:
            List[Dict]: История сообщений
        """
        return self.messages.copy()
