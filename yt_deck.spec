# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

datas = [
    ('templates', 'templates'),
    ('static', 'static'),
]

if os.path.isfile('icon.ico'):
    datas.append(('icon.ico', '.'))

for qjs_cand in ['bin/qjs.exe', 'bin/qjs']:
    if os.path.isfile(qjs_cand):
        datas.append((qjs_cand, 'bin'))
        break

packages_to_collect = ['yt_dlp', 'webview', 'curl_cffi']
if sys.platform == 'win32':
    packages_to_collect += ['clr_loader', 'pythonnet']

for pkg in packages_to_collect:
    try:
        datas += collect_data_files(pkg)
    except Exception:
        pass

hiddenimports = [
    'engineio.async_drivers.threading',
    'simple_websocket',
    'yt_dlp',
    'curl_cffi',
    'picker',
    'wsproto',
    'werkzeug',
    'jinja2',
    'webview',
    'core',
    'core.config',
    'core.engine',
    'core.queue_manager',
    'api',
    'api.routes',
    'api.sockets',
    'services',
    'services.media_trim',
    'services.updater',
]

if sys.platform == 'win32':
    hiddenimports += [
        'clr',
        'clr_loader',
        'pythonnet',
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
    ]
elif sys.platform == 'darwin':
    hiddenimports += [
        'webview.platforms.cocoa',
    ]
else:
    hiddenimports += [
        'webview.platforms.gtk',
        'webview.platforms.qt',
    ]

for pkg in ['yt_dlp.extractor', 'webview', 'core', 'api', 'services', 'curl_cffi']:
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
    icon='icon.ico' if (sys.platform == 'win32' and os.path.isfile('icon.ico')) else None,
)

if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='YT_Deck.app',
        icon=None,
        bundle_identifier='com.ytdeck.app',
        info_plist={
            'NSHighResolutionCapable': 'True',
            'CFBundleShortVersionString': '2.5.2',
            'CFBundleName': 'YT Deck',
        },
    )
