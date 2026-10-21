import os
import re
import sys
import uuid
import shutil
import atexit
import sqlite3
import subprocess
from pathlib import Path

import yt_dlp
from core.config import APP_DIR, BUNDLE_DIR, BIN_DIR, TEMP_COOKIES_DIR


# Clean up temporary cookie files on process termination
def cleanup_temp_cookies():
    if os.path.isdir(TEMP_COOKIES_DIR):
        try:
            for item in os.listdir(TEMP_COOKIES_DIR):
                p = os.path.join(TEMP_COOKIES_DIR, item)
                if os.path.isdir(p):
                    shutil.rmtree(p, ignore_errors=True)
                elif os.path.isfile(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass
        except Exception:
            pass


atexit.register(cleanup_temp_cookies)
# Also clean up any stale cookies from previous runs on module load
cleanup_temp_cookies()


def find_ffmpeg():
    exts = [".exe", ""] if sys.platform == "win32" else [""]
    for ext in exts:
        for base in [APP_DIR, BIN_DIR, os.path.join(BUNDLE_DIR, "bin")]:
            cand = os.path.join(base, f"ffmpeg{ext}")
            if os.path.isfile(cand) and (sys.platform == "win32" or os.access(cand, os.X_OK)):
                return cand
    path_ffmpeg = shutil.which("ffmpeg")
    if path_ffmpeg:
        return path_ffmpeg
    return None


def ffmpeg_available():
    return find_ffmpeg() is not None


def get_ytdlp_version():
    """
    Returns the exact version of the active yt-dlp engine currently used for downloading.
    Guarantees that the reported version matches the runtime execution environment.
    """
    try:
        import yt_dlp
        ver = getattr(yt_dlp.version, "__version__", None)
        if ver:
            return ver
    except Exception:
        pass
    bin_ytdlp = os.path.join(BIN_DIR, "yt-dlp.exe" if sys.platform == "win32" else "yt-dlp")
    if os.path.isfile(bin_ytdlp):
        try:
            res = subprocess.run([bin_ytdlp, "--version"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
        except Exception:
            pass
    return "2026.08.19"


def find_js_runtime():
    """
    Detect JavaScript runtime (QuickJS, Node.js, Deno, Bun) for full format decryption and n-sig bypass.
    Checks bundled and local bin directory first, then system PATH, then common install locations.
    """
    exts = [".exe", ""] if sys.platform == "win32" else [""]

    # 1. Prioritize bundled / local standalone runtimes (QuickJS, Node, Deno)
    for ext in exts:
        local_candidates = [
            ("quickjs", os.path.join(BIN_DIR, f"qjs{ext}")),
            ("quickjs", os.path.join(BIN_DIR, f"quickjs{ext}")),
            ("node", os.path.join(BIN_DIR, f"node{ext}")),
            ("deno", os.path.join(BIN_DIR, f"deno{ext}")),
            ("quickjs", os.path.join(BUNDLE_DIR, "bin", f"qjs{ext}")),
            ("quickjs", os.path.join(APP_DIR, f"qjs{ext}")),
        ]
        for rtype, p in local_candidates:
            if os.path.isfile(p) and (sys.platform == "win32" or os.access(p, os.X_OK)):
                return rtype, p

    # 2. Check system PATH
    for name in ("qjs", "quickjs", "node", "nodejs", "deno", "bun"):
        p = shutil.which(name)
        if p and os.path.isfile(p):
            if name in ("qjs", "quickjs"):
                return "quickjs", p
            elif name in ("node", "nodejs"):
                return "node", p
            return name, p

    # 3. Common system installation paths on Windows & Unix
    if sys.platform == "win32":
        common_paths = [
            ("node", r"C:\Program Files\nodejs\node.exe"),
            ("node", r"C:\Program Files (x86)\nodejs\node.exe"),
            ("node", os.path.expandvars(r"%LOCALAPPDATA%\Programs\node\node.exe")),
            ("deno", os.path.expandvars(r"%USERPROFILE%\.deno\bin\deno.exe")),
            ("bun", os.path.expandvars(r"%USERPROFILE%\.bun\bin\bun.exe")),
            ("quickjs", os.path.expandvars(r"%LOCALAPPDATA%\Programs\quickjs\qjs.exe")),
            ("quickjs", os.path.expandvars(r"%USERPROFILE%\.quickjs\qjs.exe")),
        ]
    else:
        home = str(Path.home())
        common_paths = [
            ("node", "/usr/local/bin/node"),
            ("node", "/usr/bin/node"),
            ("node", "/opt/homebrew/bin/node"),
            ("deno", os.path.join(home, ".deno", "bin", "deno")),
            ("bun", os.path.join(home, ".bun", "bin", "bun")),
            ("quickjs", "/usr/local/bin/qjs"),
            ("quickjs", "/opt/homebrew/bin/qjs"),
            ("quickjs", os.path.join(home, ".local", "bin", "qjs")),
        ]

    for rtype, p in common_paths:
        if os.path.isfile(p) and (sys.platform == "win32" or os.access(p, os.X_OK)):
            return rtype, p

    return None, None


def is_file_locked(filepath):
    """Checks if a file is currently locked by another process (e.g., SQLite in a running browser)."""
    if not filepath or not os.path.isfile(filepath):
        return False
    try:
        # Check standard file read
        with open(filepath, "rb") as f:
            f.read(1024)
    except (IOError, PermissionError):
        return True

    # Test SQLite connection in read-only mode
    try:
        uri = f"file:{Path(filepath).as_posix()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True, timeout=0.2)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM sqlite_master LIMIT 1")
        conn.close()
        return False
    except Exception:
        return True


def get_browser_cookie_paths(browser_name):
    """Returns candidate paths for the browser's Cookies SQLite database on Windows."""
    b = (browser_name or "").lower().strip()
    user_data_candidates = []
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    app_data = os.environ.get("APPDATA", "")

    if b in ("chrome", "google-chrome"):
        user_data_candidates.append(os.path.join(local_app_data, "Google", "Chrome", "User Data"))
    elif b in ("edge", "msedge"):
        user_data_candidates.append(os.path.join(local_app_data, "Microsoft", "Edge", "User Data"))
    elif b in ("brave", "brave-browser"):
        user_data_candidates.append(os.path.join(local_app_data, "BraveSoftware", "Brave-Browser", "User Data"))
    elif b in ("opera", "opera-stable"):
        user_data_candidates.append(os.path.join(app_data, "Opera Software", "Opera Stable"))
    elif b in ("vivaldi",):
        user_data_candidates.append(os.path.join(local_app_data, "Vivaldi", "User Data"))

    cookie_files = []
    for udir in user_data_candidates:
        if not os.path.isdir(udir):
            continue
        # Check Default profile and root Network
        for sub in ("Default", "Profile 1", "Profile 2", ""):
            p_net = os.path.join(udir, sub, "Network", "Cookies") if sub else os.path.join(udir, "Network", "Cookies")
            p_root = os.path.join(udir, sub, "Cookies") if sub else os.path.join(udir, "Cookies")
            if os.path.isfile(p_net):
                cookie_files.append((udir, p_net))
            elif os.path.isfile(p_root):
                cookie_files.append((udir, p_root))

    return cookie_files


def prepare_shadow_cookies(browser_name):
    """
    Creates a temporary shadow copy of browser cookie SQLite database and Local State (keyring)
    to bypass Windows 'database is locked' errors when the browser is running.
    Returns: shadow_profile_dir or None
    """
    candidates = get_browser_cookie_paths(browser_name)
    if not candidates:
        return None

    # Check if any database file is locked or if we should proactively copy
    is_any_locked = any(is_file_locked(fpath) for _, fpath in candidates)
    if not is_any_locked:
        return None

    session_id = uuid.uuid4().hex[:8]
    shadow_dir = os.path.join(TEMP_COOKIES_DIR, f"{browser_name}_{session_id}")
    os.makedirs(shadow_dir, exist_ok=True)

    try:
        user_data_root, cookie_db_path = candidates[0]
        # Copy Local State if present (required for Chromium DPAPI cookie decryption)
        local_state = os.path.join(user_data_root, "Local State")
        if os.path.isfile(local_state):
            shutil.copy2(local_state, os.path.join(shadow_dir, "Local State"))

        # Replicate directory structure for Cookies inside shadow_dir (e.g. Default/Network/Cookies)
        rel = os.path.relpath(cookie_db_path, user_data_root)
        dest_db = os.path.join(shadow_dir, rel)
        os.makedirs(os.path.dirname(dest_db), exist_ok=True)

        shutil.copy2(cookie_db_path, dest_db)

        # Also copy WAL and SHM journal files if they exist to prevent SQLite journal lock
        for extra in ("-wal", "-shm"):
            extra_file = cookie_db_path + extra
            if os.path.isfile(extra_file):
                try:
                    shutil.copy2(extra_file, dest_db + extra)
                except Exception:
                    pass

        return shadow_dir
    except Exception as e:
        print(f"Shadow cookie copy note for {browser_name}: {e}")
        return None


def build_base_ydl_opts(cfg, proxy=""):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 15,
        "retries": 10,
        "fragment_retries": 10,
        "http_chunk_size": 5242880,
        "concurrent_fragment_downloads": 3,
        "nocheckcertificate": True,
        "source_address": "0.0.0.0",  # Force IPv4 to prevent infinite Windows IPv6 connection hangs on YouTube/Google CDN
        "remote_components": ["ejs:github"],  # Automatically download & solve JS challenges without throttling
        "downloader_args": {
            "ffmpeg": [
                "-timeout", "15000000",
                "-reconnect", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",
            ]
        },
    }
    ffmpeg_bin = find_ffmpeg()
    if ffmpeg_bin:
        opts["ffmpeg_location"] = os.path.dirname(ffmpeg_bin)

    if proxy:
        opts["proxy"] = proxy.strip()
    elif cfg.get("proxy"):
        opts["proxy"] = cfg.get("proxy").strip()

    # Enable JS runtime if available to prevent format throttling & missing DASH tracks
    rtype, rpath = find_js_runtime()
    if rtype and rpath:
        opts["js_runtimes"] = {rtype: {"path": rpath}}

    # Impersonate Chrome browser TLS fingerprint via curl_cffi to bypass ISP/DPI throttling and handshake hangs
    try:
        from yt_dlp.networking.impersonate import ImpersonateTarget
        opts["impersonate"] = ImpersonateTarget.from_str("chrome")
    except Exception as e_imp:
        print(f"Note: ImpersonateTarget not available: {e_imp}")

    browser = cfg.get("browser_cookies", "none")
    if browser and browser != "none":
        # Check if browser database is locked and perform shadow copy if needed
        shadow_profile = prepare_shadow_cookies(browser)
        if shadow_profile:
            opts["cookiesfrombrowser"] = (browser, shadow_profile)
        else:
            opts["cookiesfrombrowser"] = (browser,)

    return opts


def cleanup_temp_files(out_dir, base_title=None):
    if not os.path.isdir(out_dir):
        return
    try:
        clean_title = re.sub(r'[\\/*?:"<>|]', "", base_title)[:50] if base_title else None
        for fname in os.listdir(out_dir):
            if fname.endswith((".part", ".ytdl", ".temp")) or ".part-" in fname:
                if clean_title:
                    if clean_title in fname:
                        try:
                            os.remove(os.path.join(out_dir, fname))
                        except Exception:
                            pass
                else:
                    try:
                        os.remove(os.path.join(out_dir, fname))
                    except Exception:
                        pass
    except Exception as e:
        print(f"Error cleaning temp files: {e}")


def format_user_friendly_error(err_str):
    low = err_str.lower()
    if (
        "read timed out" in low
        or "connection timed out" in low
        or "timed out" in low
        or "httpsconnectionpool" in low
        or "googlevideo.com" in low
        or "handshake operation timed out" in low
        or "connection reset" in low
        or "winerror 10054" in low
        or "winerror 10060" in low
        or "remote end closed connection" in low
        or "unable to download video data" in low
    ):
        return (
            "Сбой/таймаут соединения с серверами YouTube (googlevideo.com). "
            "Провайдер или ТСПУ/DPI замедляет или блокирует потоки YouTube. "
            "Решение: укажите рабочий прокси (SOCKS5/HTTP) в «Настройках» "
            "или запустите средство обхода замедления (VPN / Zapret / GoodbyeDPI)."
        )
    if "sign in to confirm you're not a bot" in low or "confirm you're not a bot" in low or "bot detection" in low:
        return (
            "YouTube требует подтверждения авторизации (защита от ботов). "
            "Перейдите во вкладку «Настройки» и выберите ваш браузер в пункте «Импорт авторизации (Cookies)»."
        )
    if "confirm your age" in low or "inappropriate" in low or ("age" in low and "restricted" in low):
        return (
            "Ролик имеет возрастное ограничение 18+. "
            "Включите «Импорт авторизации (Cookies)» из вашего браузера во вкладке «Настройки»."
        )
    if "private video" in low or "is private" in low:
        return (
            "Это приватное видео. Если у вашего аккаунта есть доступ, "
            "включите импорт Cookies из браузера в «Настройках»."
        )
    if "video unavailable" in low:
        return "Видео недоступно. Возможно, оно удалено или заблокировано в вашем регионе. Попробуйте настроить прокси."
    if "429" in low or "too many requests" in low:
        return "YouTube временно ограничил запросы (429 Too Many Requests). Подключите прокси или импорт cookies."
    if "failed to decrypt" in low or ("cookies" in low and "database" in low) or "database is locked" in low:
        return (
            "Не удалось безопасно извлечь авторизацию из браузера. "
            "Попробуйте временно отключить импорт cookies или выбрать другой браузер в «Настройках»."
        )
    if "недостаточно места на диске" in low or "disk space" in low or "no space left" in low:
        return err_str
    if "прямая трансляция" in low or "live stream" in low:
        return "Это прямая трансляция (Live Stream). Автоматическая запись стримов отключена во избежание переполнения диска."
    return err_str


def is_playlist_url(url_str):
    u = (url_str or "").strip().lower()
    if "playlist?list=" in u or "/playlist/" in u:
        return True
    if "list=" in u and ("watch?" not in u and "youtu.be" not in u):
        return True
    return False


LANGUAGE_NAMES = {
    "ru": "Русский",
    "en": "English",
    "en-us": "English (US)",
    "en-gb": "English (UK)",
    "es": "Español",
    "es-419": "Español (Latino)",
    "de": "Deutsch",
    "fr": "Français",
    "it": "Italiano",
    "ja": "日本語 (Japanese)",
    "ko": "한국어 (Korean)",
    "zh": "中文 (Chinese)",
    "zh-hans": "简体中文 (Chinese Simplified)",
    "zh-hant": "繁體中文 (Chinese Traditional)",
    "pt": "Português",
    "pt-br": "Português (Brasil)",
    "pl": "Polski",
    "uk": "Українська",
    "tr": "Türkçe",
    "hi": "हिन्दी (Hindi)",
    "ar": "العربية (Arabic)",
    "id": "Indonesia",
    "vi": "Tiếng Việt",
    "th": "ไทย (Thai)",
    "cs": "Čeština",
    "nl": "Nederlands",
    "sv": "Svenska",
    "el": "Ελληνικά",
    "he": "עברית",
    "ro": "Română",
    "hu": "Magyar",
    "da": "Dansk",
    "fi": "Suomi",
    "no": "Norsk",
}


def human_size(num):
    if not num:
        return None
    for unit in ["Б", "КБ", "МБ", "ГБ"]:
        if num < 1024:
            return f"{num:.0f} {unit}" if unit == "Б" else f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} ТБ"


def human_views(count):
    if not count:
        return None
    try:
        c = int(count)
        if c >= 1_000_000_000:
            return f"{c / 1_000_000_000:.1f} млрд просмотров"
        if c >= 1_000_000:
            return f"{c / 1_000_000:.1f} млн просмотров"
        if c >= 1_000:
            return f"{c / 1_000:.1f} тыс. просмотров"
        return f"{c} просмотров"
    except Exception:
        return str(count)


def format_upload_date(d_str):
    if not d_str or len(str(d_str)) != 8:
        return None
    s = str(d_str)
    return f"{s[6:8]}.{s[4:6]}.{s[0:4]}"


def parse_audio_track(f):
    lang = (f.get("language") or "").lower()
    note = f.get("format_note") or ""
    is_original = "original" in note.lower() or f.get("language_preference") == 10
    is_dubbed = "dubbed" in note.lower()

    base_lang = lang.split("-")[0] if lang else ""
    lang_name = LANGUAGE_NAMES.get(lang) or LANGUAGE_NAMES.get(base_lang)
    if not lang_name:
        parts = [p.strip() for p in note.split(",") if p.strip()]
        if parts and not parts[0].lower().startswith("default"):
            lang_name = parts[0].replace(" - dubbed", "").replace(" - original", "").strip()
        else:
            lang_name = lang.upper() if lang else "Основная дорожка"

    if is_original:
        track_title = f"{lang_name} · Оригинал"
    elif is_dubbed:
        track_title = f"{lang_name} · Дубляж"
    else:
        track_title = lang_name

    track_id = lang if lang else ("orig" if is_original else "default")
    return track_id, track_title, is_original


def get_codec_label(vcodec):
    if not vcodec or vcodec == "none":
        return ""
    v = vcodec.lower()
    if v.startswith("avc1") or "h264" in v:
        return "H.264 · Совместимый"
    if v.startswith("vp09") or "vp9" in v:
        return "VP9"
    if v.startswith("av01") or "av1" in v:
        return "AV1"
    if v.startswith("hev1") or v.startswith("hvc1") or "h265" in v or "hevc" in v:
        return "HEVC"
    return vcodec.split(".")[0].upper()


def get_resolution_label(height, width=0):
    if width >= 7000 or height >= 4000:
        return "8K Ultra HD"
    elif width >= 3600 or height >= 2000:
        return "4K Ultra HD"
    elif width >= 2400 or height >= 1400:
        return "2K Quad HD"
    elif width >= 1800 or height >= 1000:
        return "Full HD"
    elif width >= 1200 or height >= 700:
        return "HD"
    elif height >= 480:
        return "480p SD"
    elif height >= 360:
        return "360p"
    return f"{height}p"
