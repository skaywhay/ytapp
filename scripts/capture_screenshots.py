import os
import sys
import time
import urllib.request
import subprocess
import threading

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    os.makedirs("assets/screenshots", exist_ok=True)
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        print(f"Chrome not found at {chrome_path}")
        return

    targets = [
        ("hero_preview.png", "http://127.0.0.1:5055/?preview=hero", "1200,820"),
        ("trim_editor.png", "http://127.0.0.1:5055/?preview=trim", "1200,820"),
        ("queue_manager.png", "http://127.0.0.1:5055/?preview=queue", "1200,820"),
        ("settings_monet.png", "http://127.0.0.1:5055/?preview=settings", "1200,820"),
    ]

    for filename, url, win_size in targets:
        out_path = os.path.abspath(os.path.join("assets", "screenshots", filename))
        cmd = [
            chrome_path,
            "--headless=new",
            f"--screenshot={out_path}",
            f"--window-size={win_size}",
            "--hide-scrollbars",
            "--disable-gpu",
            "--virtual-time-budget=2000",
            url
        ]
        print(f"Capturing {filename} from {url}...")
        subprocess.run(cmd, check=True)
        if os.path.exists(out_path):
            size_kb = os.path.getsize(out_path) / 1024
            print(f"Captured {filename}: {size_kb:.1f} KB")
        else:
            print(f"Failed to capture {filename}")

if __name__ == "__main__":
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    print("Waiting for server on port 5055...")
    if wait_for_server(5055):
        print("Server is up, starting screenshot capture...")
        capture()
        print("All screenshots captured successfully.")
    else:
        print("Server failed to start.")
        sys.exit(1)
