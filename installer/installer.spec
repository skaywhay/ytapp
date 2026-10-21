# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

datas = [
    ('installer.html', '.'),
    ('installer.css', '.'),
    ('installer.js', '.'),
]

if os.path.isfile('../icon.ico'):
    datas.append(('../icon.ico', '.'))

# Include compiled YT_Deck.exe inside installer as payload
if os.path.isfile('../YT_Deck.exe'):
    datas.append(('../YT_Deck.exe', 'payload'))
elif os.path.isfile('../dist/YT_Deck.exe'):
    datas.append(('../dist/YT_Deck.exe', 'payload'))

for pkg in ['webview', 'clr_loader', 'pythonnet']:
    try:
        datas += collect_data_files(pkg)
    except Exception:
        pass

hiddenimports = [
    'picker',
    'clr',
    'clr_loader',
    'pythonnet',
    'webview',
    'webview.platforms.winforms',
    'webview.platforms.edgechromium',
]

a = Analysis(
    ['installer_app.py'],
    pathex=['.', '..'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter.test', 'unittest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='YT_Deck_Setup',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../icon.ico' if os.path.isfile('../icon.ico') else None,
)
