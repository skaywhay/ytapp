"""
YT Deck — локальный сервер-обёртка над yt-dlp с веб-интерфейсом.
Версия: 2.5 (Modular Media Engine, Unified Queue Pipeline, Material 3 Split Action & Interactive Trim)

Запуск:
    python server.py

Откроется на http://127.0.0.1:5050 (или свободном порту)
"""
import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
import urllib.request

from flask import Flask

from core.config import BUNDLE_DIR, DEFAULT_DOWNLOAD_DIR, get_user_data_dir
from core.engine import ffmpeg_available
from core.queue_manager import start_background_workers
from api.sockets import init_sockets
from api.routes import api_bp


app = Flask(
    __name__,
    template_folder=os.path.join(BUNDLE_DIR, "templates"),
    static_folder=os.path.join(BUNDLE_DIR, "static"),
)
app.config["SECRET_KEY"] = "yt-deck-local"

socketio = init_sockets(app)
app.register_blueprint(api_bp)

# Start background queue dispatcher and orphan cleanup workers
start_background_workers(socketio)


def find_available_port(default_port=5050):
    for p in [default_port, 5051, 5052, 5500, 8080]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return default_port


def open_browser(port):
    time.sleep(1.0)
    try:
        webbrowser.open(f"http://127.0.0.1:{port}")
    except Exception:
        pass


def run_app():
    env_port = os.environ.get("PORT")
    port = int(env_port) if env_port else find_available_port(5050)

    if "--browser" in sys.argv:
        print("=" * 60)
        print(f" YT Deck запущен в браузере: http://127.0.0.1:{port}")
        print(f" Папка загрузок по умолчанию: {DEFAULT_DOWNLOAD_DIR}")
        if not ffmpeg_available():
            print(" ВНИМАНИЕ: ffmpeg не найден — склейка видео+звука")
            print(" и конвертация аудио работать не будут. Положите ffmpeg.exe рядом.")
        print("=" * 60)
        threading.Thread(target=open_browser, args=(port,), daemon=True).start()
        socketio.run(app, host="127.0.0.1", port=port, debug=False, allow_unsafe_werkzeug=True)
        return

    def start_server():
        socketio.run(app, host="127.0.0.1", port=port, debug=False, allow_unsafe_werkzeug=True)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=0.25) as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.08)

    try:
        import webview
        user_data_dir = get_user_data_dir()
        storage_path = os.path.join(user_data_dir, "webview")
        os.makedirs(storage_path, exist_ok=True)
        window = webview.create_window(
            title="YT Deck",
            url=f"http://127.0.0.1:{port}",
            width=1160,
            height=860,
            min_size=(900, 660),
            background_color="#09090b",
            text_select=True,
            zoomable=True,
        )
        webview.start(debug=False, private_mode=False, storage_path=storage_path)
    except Exception as e:
        print(f"WebView initialization fallback: {e}")
        open_browser(port)
        server_thread.join()
    finally:
        os._exit(0)


if __name__ == "__main__":
    run_app()
