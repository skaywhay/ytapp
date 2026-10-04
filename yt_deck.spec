# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

datas = [
    ('templates', 'templates'),
    ('static', 'static'),
    ('icon.ico', '.'),
]

for pkg in ['yt_dlp', 'webview', 'clr_loader', 'pythonnet']:
    try:
        datas += collect_data_files(pkg)
    except Exception:
        pass

hiddenimports = [
    'engineio.async_drivers.threading',
    'simple_websocket',
    'yt_dlp',
    'picker',
    'wsproto',
    'werkzeug',
    'jinja2',
    'clr',
    'clr_loader',
    'pythonnet',
    'webview',
    'webview.platforms.winforms',
    'webview.platforms.edgechromium',
]

for pkg in ['yt_dlp.extractor', 'webview']:
    try:
        hiddenimports += collect_submodules(pkg)
    except Exception:
        pass

a = Analysis(
    ['server.py'],
    pathex=['.'],
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
    name='YT_Deck',
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
    icon='icon.ico',
)
