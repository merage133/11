# -*- mode: python ; coding: utf-8 -*-

import sys
from pathlib import Path

block_cipher = None

# Определяем datas список
datas_list = []

# Проверяем наличие модели Vosk
vosk_paths = [
    'models/vosk-model-small-ru-0.22',
    'vosk-model-small-ru-0.22',
]

for p in vosk_paths:
    if Path(p).exists():
        datas_list.append((p, 'models/vosk-model-small-ru-0.22'))
        break

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas_list,
    hiddenimports=[
        'PyQt6',
        'PyQt6.QtCore',
        'PyQt6.QtGui',
        'PyQt6.QtWidgets',
        'vosk',
        'sounddevice',
        'numpy',
        'duckduckgo_search',
        'psutil',
        'sympy',
        'requests',
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
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='AIAgent',
)
