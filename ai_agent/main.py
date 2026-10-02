"""
AI Agent - Автономный AI помощник с циклом ReAct
Точка входа приложения
"""
import sys
import os
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_agent.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def check_dependencies():
    """Проверяет наличие необходимых зависимостей"""
    missing = []
    
    try:
        import PyQt6
    except ImportError:
        missing.append("PyQt6")
    
    try:
        import requests
    except ImportError:
        missing.append("requests")
    
    try:
        import duckduckgo_search
    except ImportError:
        missing.append("duckduckgo_search")
    
    try:
        import psutil
    except ImportError:
        missing.append("psutil")
    
    try:
        import sympy
    except ImportError:
        missing.append("sympy")
    
    if missing:
        print("❌ Отсутствуют необходимые зависимости:")
        for dep in missing:
            print(f"  - {dep}")
        print("\nУстановите их командой:")
        print(f"  pip install {' '.join(missing)}")
        return False
    
    return True


def check_ollama():
    """Проверяет доступность Ollama"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            logger.info("Ollama доступна")
            return True
        else:
            logger.warning(f"Ollama вернула статус {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Ollama недоступна: {e}")
        return False


def create_workspace():
    """Создаёт рабочую область если её нет"""
    from utils import get_workspace_dir
    workspace = get_workspace_dir()
    logger.info(f"Рабочая область: {workspace}")


def main():
    """Главная функция приложения"""
    try:
        logger.info("Запуск AI Agent")
        
        # Проверяем зависимости
        if not check_dependencies():
            sys.exit(1)
        
        # Создаём рабочую область
        create_workspace()
        
        # Проверяем Ollama
        if not check_ollama():
            logger.warning("Ollama не запущена. Запустите: ollama serve")
        
        # Импортируем PyQt6 после проверки зависимостей
        from PyQt6.QtWidgets import QApplication
        from PyQt6.QtCore import Qt
        
        # Включаем высокую DPI поддержку
        os.environ['QT_ENABLE_HIGHDPI_SCALING'] = '1'
        
        # Создаём приложение
        app = QApplication(sys.argv)
        app.setApplicationName("AI Agent")
        app.setApplicationVersion("1.0.0")
        
        # Импортируем и создаём главное окно
        from ui_main import MainWindow
        window = MainWindow()
        window.show()
        
        logger.info("Приложение запущено")
        
        # Запускаем цикл событий
        sys.exit(app.exec())
        
    except KeyboardInterrupt:
        logger.info("Приложение остановлено пользователем")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}", exc_info=True)
        
        # Показываем окно с ошибкой
        try:
            from PyQt6.QtWidgets import QApplication, QMessageBox
            app = QApplication(sys.argv)
            QMessageBox.critical(
                None,
                "Критическая ошибка",
                f"Произошла критическая ошибка:\n\n{str(e)}\n\nПодробности в файле ai_agent.log"
            )
        except:
            pass
        
        sys.exit(1)


if __name__ == "__main__":
    main()
