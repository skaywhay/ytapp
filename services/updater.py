import os
import re
import sys
import json
import shutil
import zipfile
import subprocess
import urllib.request

from core.config import MODULES_DIR
from core.engine import get_ytdlp_version, ffmpeg_available, find_ffmpeg


def update_ytdlp_engine(bin_dir):
    current_ver = get_ytdlp_version()
    try:
        latest_tag = ""
        exe_url = None
        whl_url = None
        pypi_ver = ""

        # 1. Fetch metadata from GitHub Releases
        try:
            req_gh = urllib.request.Request(
                "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest",
                headers={"User-Agent": "YT-Deck-Client"},
            )
            with urllib.request.urlopen(req_gh, timeout=10) as resp:
                gh_data = json.loads(resp.read().decode("utf-8"))
            latest_tag = gh_data.get("tag_name", "").strip()
            for a in gh_data.get("assets", []):
                if a.get("name") == "yt-dlp.exe":
                    exe_url = a.get("browser_download_url")
                elif a.get("name", "").endswith(".whl"):
                    whl_url = a.get("browser_download_url")
        except Exception as e_gh:
            print(f"GitHub release check note: {e_gh}")

        # 2. Fetch metadata from PyPI (for pure Python universal wheel)
        try:
            req_pypi = urllib.request.Request(
                "https://pypi.org/pypi/yt-dlp/json",
                headers={"User-Agent": "YT-Deck-Client"},
            )
            with urllib.request.urlopen(req_pypi, timeout=10) as resp:
                pypi_data = json.loads(resp.read().decode("utf-8"))
            pypi_ver = pypi_data.get("info", {}).get("version", "").strip()
            if not latest_tag:
                latest_tag = pypi_ver
            if not whl_url:
                for u in pypi_data.get("urls", []):
                    if u.get("filename", "").endswith(".whl"):
                        whl_url = u.get("url")
                        break
        except Exception as e_pypi:
            print(f"PyPI check note: {e_pypi}")

        target_ver = latest_tag or pypi_ver
        if not target_ver:
            return {"ok": False, "error": "Не удалось получить информацию о последней версии yt-dlp с серверов."}

        # Normalize versions for comparison (e.g. 2026.08.19 vs 2026.8.19)
        norm_curr = re.sub(r"\.0+(\d)", r".\1", current_ver.lstrip("v"))
        norm_target = re.sub(r"\.0+(\d)", r".\1", target_ver.lstrip("v"))
        if norm_curr == norm_target:
            return {
                "ok": True,
                "updated": False,
                "current_version": current_ver,
                "latest_version": target_ver,
                "message": f"У вас уже установлена новейшая версия yt-dlp ({current_ver}).",
            }

        # 3. Download standalone executable if available
        if exe_url:
            os.makedirs(bin_dir, exist_ok=True)
            target_exe = os.path.join(bin_dir, "yt-dlp.exe")
            temp_exe = target_exe + ".tmp"
            try:
                req_dl = urllib.request.Request(exe_url, headers={"User-Agent": "YT-Deck-Client"})
                with urllib.request.urlopen(req_dl, timeout=45) as dl_resp, open(temp_exe, "wb") as f_out:
                    f_out.write(dl_resp.read())
                if os.path.isfile(temp_exe) and os.path.getsize(temp_exe) > 1024 * 1024:
                    os.replace(temp_exe, target_exe)
            except Exception as e_exe:
                print(f"yt-dlp.exe download note: {e_exe}")
                if os.path.isfile(temp_exe):
                    try:
                        os.remove(temp_exe)
                    except Exception:
                        pass

        # 4. Download and unpack Python wheel into MODULES_DIR for dynamic frozen import
        if whl_url:
            os.makedirs(MODULES_DIR, exist_ok=True)
            temp_whl = os.path.join(MODULES_DIR, "yt_dlp_update.whl")
            staging_dir = os.path.join(MODULES_DIR, "yt_dlp_staging")
            target_pkg_dir = os.path.join(MODULES_DIR, "yt_dlp")

            try:
                req_whl = urllib.request.Request(whl_url, headers={"User-Agent": "YT-Deck-Client"})
                with urllib.request.urlopen(req_whl, timeout=60) as dl_whl, open(temp_whl, "wb") as f_whl:
                    f_whl.write(dl_whl.read())

                if os.path.isdir(staging_dir):
                    shutil.rmtree(staging_dir, ignore_errors=True)
                os.makedirs(staging_dir, exist_ok=True)

                with zipfile.ZipFile(temp_whl, "r") as zf:
                    for member in zf.namelist():
                        if member.startswith("yt_dlp/"):
                            zf.extract(member, MODULES_DIR)

                if os.path.isfile(temp_whl):
                    try:
                        os.remove(temp_whl)
                    except Exception:
                        pass
            except Exception as e_whl:
                print(f"Wheel package unpack note: {e_whl}")

        # 5. For non-frozen developer run, also invoke pip upgrade
        if not getattr(sys, "frozen", False):
            try:
                subprocess.run(
                    [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
                    capture_output=True,
                    text=True,
                    timeout=45,
                )
            except Exception as e_pip:
                print(f"Pip upgrade note: {e_pip}")

        # 6. Dynamically reload yt_dlp module in runtime memory
        try:
            if MODULES_DIR not in sys.path:
                sys.path.insert(0, MODULES_DIR)
            for mod_name in list(sys.modules.keys()):
                if mod_name == "yt_dlp" or mod_name.startswith("yt_dlp."):
                    sys.modules.pop(mod_name, None)
            import yt_dlp
        except Exception as e_reload:
            print(f"Module reload note: {e_reload}")

        active_ver = get_ytdlp_version()
        return {
            "ok": True,
            "updated": True,
            "old_version": current_ver,
            "new_version": active_ver,
            "message": f"yt-dlp успешно обновлён до версии {active_ver}!",
        }
    except Exception as e:
        return {"ok": False, "error": f"Ошибка обновления yt-dlp: {e}"}


def download_ffmpeg_engine(bin_dir):
    os.makedirs(bin_dir, exist_ok=True)
    temp_zip = os.path.join(bin_dir, "ffmpeg_bundle.zip")

    url = "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "YT-Deck-Client"})
        with urllib.request.urlopen(req, timeout=60) as resp, open(temp_zip, "wb") as out_f:
            out_f.write(resp.read())

        with zipfile.ZipFile(temp_zip, "r") as zf:
            for member in zf.namelist():
                if member.lower().endswith("ffmpeg.exe") or member.lower().endswith("ffprobe.exe"):
                    base_name = os.path.basename(member)
                    target = os.path.join(bin_dir, base_name)
                    with zf.open(member) as source, open(target, "wb") as target_file:
                        shutil.copyfileobj(source, target_file)

        if os.path.isfile(temp_zip):
            try:
                os.remove(temp_zip)
            except Exception:
                pass

        if ffmpeg_available():
            return {
                "ok": True,
                "message": "FFmpeg успешно загружен и готов к склейке!",
                "ffmpeg_path": find_ffmpeg(),
            }
        return {"ok": False, "error": "Не удалось распаковать ffmpeg.exe"}
    except Exception as e:
        return {"ok": False, "error": f"Ошибка скачивания FFmpeg: {e}"}


def check_app_update():
    """
    Checks GitHub Releases for the latest version of YT Deck (skaywhay/ytapp).
    """
    from core.config import APP_VERSION, GITHUB_REPO
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "YT-Deck-Client", "Accept": "application/vnd.github.v3+json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        latest_tag = data.get("tag_name", "").strip()
        clean_latest = latest_tag.lstrip("v").strip()
        clean_curr = APP_VERSION.lstrip("v").strip()

        # Parse semver tuples for comparison
        def parse_ver(v_str):
            parts = []
            for part in re.split(r"[\.-]", v_str):
                if part.isdigit():
                    parts.append(int(part))
                else:
                    parts.append(0)
            while len(parts) < 3:
                parts.append(0)
            return tuple(parts[:3])

        latest_tuple = parse_ver(clean_latest)
        curr_tuple = parse_ver(clean_curr)
        has_update = latest_tuple > curr_tuple

        assets = []
        for a in data.get("assets", []):
            assets.append({
                "name": a.get("name"),
                "size_mb": round(a.get("size", 0) / (1024 * 1024), 2),
                "download_url": a.get("browser_download_url"),
            })

        return {
            "ok": True,
            "has_update": has_update,
            "current_version": f"v{clean_curr}",
            "latest_version": latest_tag if latest_tag.startswith("v") else f"v{latest_tag}",
            "release_name": data.get("name") or latest_tag,
            "release_url": data.get("html_url") or f"https://github.com/{GITHUB_REPO}/releases/latest",
            "release_notes": data.get("body") or "",
            "published_at": data.get("published_at") or "",
            "assets": assets,
        }
    except Exception as e:
        from core.config import APP_VERSION
        return {
            "ok": False,
            "error": f"Не удалось проверить обновления: {e}",
            "current_version": f"v{APP_VERSION}",
        }


def download_and_launch_installer(asset_url=None):
    """
    Downloads the latest release installer to a temporary location and executes it in update mode (/update).
    """
    import tempfile
    from core.config import GITHUB_REPO

    try:
        if not asset_url:
            info = check_app_update()
            if not info.get("ok") or not info.get("assets"):
                return {"ok": False, "error": "Не удалось получить список файлов релиза с GitHub."}
            for a in info["assets"]:
                name = (a.get("name") or "").lower()
                if name.endswith("_setup.exe") or name.endswith("setup.exe"):
                    asset_url = a.get("download_url")
                    break
            if not asset_url:
                asset_url = info["assets"][0].get("download_url")

        if not asset_url:
            return {"ok": False, "error": "Ссылка на установщик обновления не найдена."}

        temp_dir = tempfile.gettempdir()
        installer_path = os.path.join(temp_dir, "YT_Deck_Setup.exe")

        req = urllib.request.Request(
            asset_url,
            headers={"User-Agent": "YT-Deck-Client"}
        )
        with urllib.request.urlopen(req, timeout=120) as resp, open(installer_path, "wb") as f_out:
            shutil.copyfileobj(resp, f_out)

        if not os.path.isfile(installer_path) or os.path.getsize(installer_path) < 1024 * 1024:
            return {"ok": False, "error": "Загруженный файл обновления поврежден."}

        # Launch the installer in update mode
        if sys.platform == "win32":
            subprocess.Popen(
                [installer_path, "/update"],
                creationflags=subprocess.DETACHED_PROCESS,
                close_fds=True,
            )
        else:
            subprocess.Popen([installer_path, "/update"], close_fds=True)

        return {
            "ok": True,
            "message": "Обновление успешно загружено. Запуск программы обновления...",
        }
    except Exception as e:
        return {"ok": False, "error": f"Ошибка загрузки обновления: {e}"}

