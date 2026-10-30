# -*- coding: utf-8 -*-
import os
import sys
import time
import shutil
import urllib.request
import subprocess
import threading

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def find_browser():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def start_server():
    from server import app, socketio
    socketio.run(app, host="127.0.0.1", port=5055, debug=False, allow_unsafe_werkzeug=True)

def wait_for_server(port=5055, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=1.0) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False

def capture():
    os.makedirs("assets/screenshots/ru", exist_ok=True)
    os.makedirs("assets/screenshots/en", exist_ok=True)

    browser_path = find_browser()
    if not browser_path:
        print("Neither Chrome nor Edge found!")
        return
    print(f"Using browser: {browser_path}")

    langs = [
        ("ru", "assets/screenshots/ru"),
        ("en", "assets/screenshots/en"),
    ]

    modes = [
        ("hero_preview.png", "hero", "1240,840"),
        ("trim_editor.png", "trim", "1240,840"),
        ("queue_manager.png", "queue", "1240,840"),
        ("settings_monet.png", "settings", "1240,840"),
    ]

    for lang, folder in langs:
        for filename, preview_mode, win_size in modes:
            url = f"http://127.0.0.1:5055/?preview={preview_mode}&lang={lang}"
            out_path = os.path.abspath(os.path.join(folder, filename))
            cmd = [
                browser_path,
                "--headless=new",
                f"--screenshot={out_path}",
                f"--window-size={win_size}",
                "--hide-scrollbars",
                "--disable-gpu",
                "--virtual-time-budget=2500",
                url
            ]
            print(f"Capturing [{lang.upper()}] {filename} from {url}...")
            subprocess.run(cmd, check=True)
            if os.path.exists(out_path):
                size_kb = os.path.getsize(out_path) / 1024
                print(f"Captured [{lang.upper()}] {filename}: {size_kb:.1f} KB")
            else:
                print(f"Failed to capture [{lang.upper()}] {filename}")

    # Also copy Russian screenshots to root assets/screenshots for backward compatibility
    for filename, _, _ in modes:
        src = os.path.join("assets", "screenshots", "ru", filename)
        dst = os.path.join("assets", "screenshots", filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)

if __name__ == "__main__":
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    print("Waiting for server on port 5055...")
    if wait_for_server(5055):
        print("Server is up, starting screenshot capture...")
        capture()
        print("All screenshots captured successfully.")
        os._exit(0)
    else:
        print("Server failed to start.")
        sys.exit(1)
