# -*- mode: python ; coding: utf-8 -*-

"""
Конфигурация PyInstaller для сборки AI Agent в EXE
"""

import sys
from pathlib import Path

# Определяем базовую директорию
block_cipher = None

# Путь к модели Vosk (если включена в exe)
vosk_model_path = None
if Path('models/vosk-model-small-ru-0.22').exists():
    vosk_model_path = 'models/vosk-model-small-ru-0.22'

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        # Включаем модель Vosk если она есть
        (vosk_model_path, 'models/vosk-model-small-ru-0.22') if vosk_model_path else None,
    ],
    hiddenimports=[
        # PyQt6
        'PyQt6',
        'PyQt6.QtCore',
        'PyQt6.QtGui',
        'PyQt6.QtWidgets',
        
        # Vosk
        'vosk',
        
        # Sounddevice
        'sounddevice',
        
        # NumPy
        'numpy',
        
        # DuckDuckGo Search
        'duckduckgo_search',
        
        # Psutil
        'psutil',
        
        # Sympy
        'sympy',
        
        # Requests
        'requests',
        
        # Другие зависимости
        'json',
        'queue',
        'logging',
        'pathlib',
        'subprocess',
        'webbrowser',
        'datetime',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Исключаем ненужные модули для уменьшения размера
        'matplotlib',
        'scipy',
        'pandas',
        'PIL',
        'cv2',
        'tensorflow',
        'torch',
    ],
    noarchive=False,
    optimize=0,
    cipher=block_cipher
)

# Фильтруем None из datas
a.datas = [data for data in a.datas if data is not None]

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AIAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # Скрываем консоль (окно терминала)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app_icon.ico' if Path('app_icon.ico').exists() else None,
    version='1.0.0'
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AIAgent'
)

# Для создания одного файла (onefile) раскомментируйте следующий блок
# и закомментируйте блок COLLECT выше

# app = EXE(
#     pyz,
#     a.scripts,
#     a.binaries,
#     a.datas,
#     [],
#     name='AIAgent',
#     debug=False,
#     bootloader_ignore_signals=False,
#     strip=False,
#     upx=True,
#     upx_exclude=[],
#     runtime_tmpdir=None,
#     console=False,
#     disable_windowed_traceback=False,
#     argv_emulation=False,
#     target_arch=None,
#     codesign_identity=None,
#     entitlements_file=None,
#     icon='app_icon.ico' if Path('app_icon.ico').exists() else None,
#     version='1.0.0'
# )
