import os
import sys
import json
from pathlib import Path

if getattr(sys, "frozen", False):
    BUNDLE_DIR = sys._MEIPASS
    APP_DIR = os.path.dirname(sys.executable)
else:
    BUNDLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    APP_DIR = BUNDLE_DIR

BIN_DIR = os.path.join(APP_DIR, "bin")
os.makedirs(BIN_DIR, exist_ok=True)

DEFAULT_DOWNLOAD_DIR = str(Path.home() / "Downloads" / "YT-Deck")
os.makedirs(DEFAULT_DOWNLOAD_DIR, exist_ok=True)


def get_user_data_dir():
    portable_marker = os.path.join(APP_DIR, "portable.txt")
    if os.path.isfile(portable_marker):
        d = os.path.join(APP_DIR, "data")
    elif sys.platform == "win32":
        appdata = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
        d = os.path.join(appdata, "YT-Deck")
    elif sys.platform == "darwin":
        d = os.path.join(str(Path.home()), "Library", "Application Support", "YT-Deck")
    else:
        xdg_config = os.environ.get("XDG_CONFIG_HOME") or os.path.join(str(Path.home()), ".config")
        d = os.path.join(xdg_config, "yt-deck")
    os.makedirs(d, exist_ok=True)
    return d


USER_DATA_DIR = get_user_data_dir()
MODULES_DIR = os.path.join(USER_DATA_DIR, "modules")
os.makedirs(MODULES_DIR, exist_ok=True)
if MODULES_DIR not in sys.path:
    sys.path.insert(0, MODULES_DIR)

LOCAL_YTDLP_DIR = os.path.join(BIN_DIR, "yt-dlp")
if os.path.isdir(LOCAL_YTDLP_DIR) and LOCAL_YTDLP_DIR not in sys.path:
    sys.path.insert(0, LOCAL_YTDLP_DIR)
TEMP_COOKIES_DIR = os.path.join(USER_DATA_DIR, "temp_cookies")
os.makedirs(TEMP_COOKIES_DIR, exist_ok=True)

APP_VERSION = "2.5.2"
GITHUB_REPO = "skaywhay/ytapp"

CONFIG_FILE = os.path.join(USER_DATA_DIR, "config.json")
QUEUE_FILE = os.path.join(USER_DATA_DIR, "queue.json")


def load_config():
    defaults = {
        "language": "ru",
        "theme_mode": "dark",
        "monet_palette": "crimson",
        "default_dir": DEFAULT_DOWNLOAD_DIR,
        "proxy": "",
        "browser_cookies": "none",
        "expert_mode": False,
        "preferred_codec": "auto",
        "preferred_container": "mp4",
        "preferred_audio_format": "mp3",
    }
    if os.path.isfile(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    defaults.update(data)
        except Exception as e:
            print(f"Error loading config: {e}")
    return defaults


def save_config(patch):
    try:
        current = load_config()
        if isinstance(patch, dict):
            current.update(patch)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        return current
    except Exception as e:
        print(f"Error saving config: {e}")
        return None
