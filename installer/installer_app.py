"""
YT Deck — Графический инсталлятор в стиле Material Design 3.
Поддерживает установку без прав администратора (%LOCALAPPDATA%\\Programs\\YT-Deck),
создание ярлыков WScript.Shell, регистрацию в Windows Apps и чистый деинсталлятор.
"""
import os
import sys
import time
import shutil
import zipfile
import subprocess
import threading
import urllib.request
from pathlib import Path

# Embedded resources resolution for PyInstaller
if getattr(sys, "frozen", False):
    INSTALLER_DIR = sys._MEIPASS
else:
    INSTALLER_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_ROOT = os.path.abspath(os.path.join(INSTALLER_DIR, ".."))


INSTALLER_VERSION = "2.5.2"


def get_default_target_dir():
    localapp = os.environ.get("LOCALAPPDATA")
    if not localapp:
        localapp = str(Path.home() / "AppData" / "Local")
    return os.path.join(localapp, "Programs", "YT-Deck")


def scan_existing_installation():
    """
    Scans the system for an existing YT Deck installation via Windows Registry and standard locations.
    Returns metadata dict: {'found': bool, 'path': str, 'installed_version': str, 'installer_version': str, 'is_update': bool}.
    """
    info = {
        "found": False,
        "path": "",
        "installed_version": "",
        "version": INSTALLER_VERSION,
        "installer_version": INSTALLER_VERSION,
        "is_update": False,
    }
    if sys.platform == "win32":
        try:
            import winreg
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\YT-Deck"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                loc, _ = winreg.QueryValueEx(key, "InstallLocation")
                ver, _ = winreg.QueryValueEx(key, "DisplayVersion")
                if loc and (os.path.isdir(loc) or os.path.isfile(os.path.join(loc, "YT_Deck.exe"))):
                    info["found"] = True
                    info["is_update"] = True
                    info["path"] = os.path.normpath(loc)
                    if ver:
                        info["installed_version"] = str(ver)
                        info["version"] = str(ver)
                    return info
        except Exception:
            pass

    default_dir = get_default_target_dir()
    if os.path.isfile(os.path.join(default_dir, "YT_Deck.exe")):
        info["found"] = True
        info["is_update"] = True
        info["path"] = os.path.normpath(default_dir)
        return info

    return info


def create_windows_shortcut(target_exe, shortcut_path, icon_path=None, description="YT Deck"):
    """
    Creates a valid Windows .lnk shortcut using standard WScript.Shell via PowerShell.
    Zero third-party dependencies required.
    """
    target_clean = os.path.normpath(target_exe).replace("'", "''")
    shortcut_clean = os.path.normpath(shortcut_path).replace("'", "''")
    work_dir = os.path.dirname(target_clean).replace("'", "''")
    desc_clean = description.replace("'", "''")

    ps_script = f"""
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut('{shortcut_clean}')
    $Shortcut.TargetPath = '{target_clean}'
    $Shortcut.WorkingDirectory = '{work_dir}'
    $Shortcut.Description = '{desc_clean}'
    """
    if icon_path and os.path.isfile(icon_path):
        icon_clean = os.path.normpath(icon_path).replace("'", "''")
        ps_script += f"\n$Shortcut.IconLocation = '{icon_clean}'"
    ps_script += "\n$Shortcut.Save()"

    try:
        subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
        )
    except Exception as e:
        print(f"Error creating shortcut {shortcut_path}: {e}")


def register_in_windows_uninstall(target_dir, exe_path, uninstaller_path, version="2.5.2"):
    """
    Registers the application in Windows Registry (HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall)
    so it appears in Windows 10/11 Settings -> Apps & features with official icon and uninstaller.
    """
    if sys.platform != "win32":
        return
    try:
        import winreg
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\YT-Deck"
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
            winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, "YT Deck")
            winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, version)
            winreg.SetValueEx(key, "Publisher", 0, winreg.REG_SZ, "YT Deck Project")
            winreg.SetValueEx(key, "DisplayIcon", 0, winreg.REG_SZ, exe_path)
            winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, target_dir)
            winreg.SetValueEx(key, "UninstallString", 0, winreg.REG_SZ, f'"{uninstaller_path}"')
            winreg.SetValueEx(key, "NoModify", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, "NoRepair", 0, winreg.REG_DWORD, 1)
    except Exception as e:
        print(f"Failed to register in Windows uninstall registry: {e}")


class InstallerApi:
    def __init__(self, window_holder):
        self.window_holder = window_holder
        self.installed_exe_path = ""

    def check_existing(self):
        return scan_existing_installation()

    def get_default_target_dir(self):
        return get_default_target_dir()

    def pick_folder(self, current_path=""):
        try:
            from picker import pick_with_powershell, pick_with_tkinter
            folder = pick_with_powershell(current_path or get_default_target_dir())
            if not folder:
                folder = pick_with_tkinter(current_path or get_default_target_dir())
            return folder or current_path
        except Exception:
            return current_path

    def close(self):
        if self.window_holder[0]:
            self.window_holder[0].destroy()
        sys.exit(0)

    def start_install(self, options):
        target_dir = options.get("target_dir") or get_default_target_dir()
        install_ffmpeg = options.get("install_ffmpeg", True)
        create_desktop = options.get("create_desktop_shortcut", True)
        create_startmenu = options.get("create_start_menu_shortcut", True)
        register_app = options.get("register_app", True)
        is_update = options.get("is_update", False)

        threading.Thread(
            target=self._run_install_worker,
            args=(target_dir, install_ffmpeg, create_desktop, create_startmenu, register_app, is_update),
            daemon=True
        ).start()

    def _set_progress(self, percent, msg):
        win = self.window_holder[0]
        if win:
            safe_msg = msg.replace("'", "\\'")
            win.evaluate_js(f"window.updateInstallerProgress({percent}, '{safe_msg}');")

    def _notify_finished(self, success, error_msg=""):
        win = self.window_holder[0]
        if win:
            safe_err = error_msg.replace("'", "\\'")
            win.evaluate_js(f"window.onInstallationFinished({'true' if success else 'false'}, '{safe_err}');")

    def _download_and_extract_ffmpeg(self, dest_bin_dir):
        url = "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
        temp_zip = os.path.join(dest_bin_dir, "ffmpeg_download.tmp")
        try:
            self._set_progress(45, "Загрузка медиакомпонентов FFmpeg с серверов GitHub...")
            req = urllib.request.Request(url, headers={"User-Agent": "YT-Deck-Installer"})
            with urllib.request.urlopen(req, timeout=90) as resp, open(temp_zip, "wb") as f_out:
                total_len = resp.headers.get("Content-Length")
                total_bytes = int(total_len) if total_len and total_len.isdigit() else 0
                downloaded = 0
                chunk_size = 1024 * 1024
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f_out.write(chunk)
                    downloaded += len(chunk)
                    if total_bytes > 0:
                        pct = int(45 + (downloaded / total_bytes) * 15)
                        mb_done = downloaded / (1024 * 1024)
                        mb_total = total_bytes / (1024 * 1024)
                        self._set_progress(pct, f"Загрузка FFmpeg: {mb_done:.1f} МБ из {mb_total:.1f} МБ...")

            self._set_progress(62, "Распаковка компонентов FFmpeg...")
            with zipfile.ZipFile(temp_zip, "r") as zf:
                for member in zf.namelist():
                    lower_name = member.lower()
                    if lower_name.endswith("ffmpeg.exe") or lower_name.endswith("ffprobe.exe"):
                        base_name = os.path.basename(member)
                        target = os.path.join(dest_bin_dir, base_name)
                        with zf.open(member) as source, open(target, "wb") as target_file:
                            shutil.copyfileobj(source, target_file)
        finally:
            if os.path.isfile(temp_zip):
                try:
                    os.remove(temp_zip)
                except Exception:
                    pass

    def _run_install_worker(self, target_dir, install_ffmpeg, create_desktop, create_startmenu, register_app, is_update=False):
        try:
            verb = "Обновление" if is_update else "Установка"

            # Terminate existing running YT_Deck processes to avoid WinError 5 lock
            if sys.platform == "win32":
                self._set_progress(5, "Остановка активных процессов YT Deck...")
                try:
                    subprocess.run(
                        ["taskkill", "/f", "/im", "YT_Deck.exe"],
                        capture_output=True,
                        timeout=5,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                except Exception:
                    pass
                time.sleep(0.3)

            self._set_progress(15, "Проверка рабочей директории..." if is_update else "Подготовка директории установки...")
            os.makedirs(target_dir, exist_ok=True)
            time.sleep(0.2)

            self._set_progress(25, f"{verb} компонентов YT Deck...")
            # Locate payload YT_Deck.exe
            exe_source = None
            candidates = [
                os.path.join(INSTALLER_DIR, "payload", "YT_Deck.exe"),
                os.path.join(INSTALLER_DIR, "YT_Deck.exe"),
                os.path.join(PROJECT_ROOT, "dist", "YT_Deck.exe"),
                os.path.join(PROJECT_ROOT, "YT_Deck.exe"),
            ]
            for c in candidates:
                if os.path.isfile(c):
                    exe_source = c
                    break

            if not exe_source:
                raise FileNotFoundError("Исполняемый файл YT_Deck.exe для установки не найден.")

            dest_exe = os.path.join(target_dir, "YT_Deck.exe")
            shutil.copy2(exe_source, dest_exe)
            self.installed_exe_path = dest_exe

            # Copy icon if present
            icon_source = None
            for icon_cand in [
                os.path.join(INSTALLER_DIR, "icon.ico"),
                os.path.join(PROJECT_ROOT, "icon.ico"),
            ]:
                if os.path.isfile(icon_cand):
                    icon_source = icon_cand
                    break

            dest_icon = os.path.join(target_dir, "icon.ico")
            if icon_source:
                shutil.copy2(icon_source, dest_icon)
            else:
                dest_icon = dest_exe

            # Install FFmpeg and utility binaries if requested
            if install_ffmpeg:
                dest_bin_dir = os.path.join(target_dir, "bin")
                os.makedirs(dest_bin_dir, exist_ok=True)
                self._set_progress(35, f"{verb} медиаконвертера FFmpeg...")

                bin_candidates = [
                    os.path.join(INSTALLER_DIR, "payload", "bin"),
                    os.path.join(INSTALLER_DIR, "bin"),
                    os.path.join(PROJECT_ROOT, "bin"),
                ]

                found_ffmpeg = False
                for b_name in ["ffmpeg.exe", "ffprobe.exe", "qjs.exe"]:
                    for c_dir in bin_candidates:
                        src_bin = os.path.join(c_dir, b_name)
                        if os.path.isfile(src_bin):
                            shutil.copy2(src_bin, os.path.join(dest_bin_dir, b_name))
                            if b_name == "ffmpeg.exe":
                                found_ffmpeg = True
                            break

                # If ffmpeg.exe was not bundled offline, download it automatically
                if not found_ffmpeg:
                    try:
                        self._download_and_extract_ffmpeg(dest_bin_dir)
                    except Exception as e_dl:
                        print(f"Warning: automatic FFmpeg download failed: {e_dl}")

            self._set_progress(60, f"{verb} системного деинсталлятора...")
            # Create uninstaller script
            uninstaller_cmd = os.path.join(target_dir, "uninstall.cmd")
            uninstall_content = f"""@echo off
chcp 65001 >nul
title Деинсталляция YT Deck
echo ========================================================
echo                 Удаление YT Deck
echo ========================================================
echo.
echo Завершение активных процессов...
taskkill /f /im YT_Deck.exe 2>nul
timeout /t 1 /nobreak >nul

echo Удаление ярлыков...
del /f /q "%USERPROFILE%\\Desktop\\YT Deck.lnk" 2>nul
del /f /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\YT Deck.lnk" 2>nul

echo Удаление записей из реестра Windows...
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YT-Deck" /f 2>nul

echo Удаление программных файлов...
cd /d "%TEMP%"
rmdir /s /q "{target_dir}" 2>nul

echo.
echo ========================================================
echo  [OK] YT Deck успешно удален с вашего компьютера.
echo ========================================================
echo.
pause
"""
            with open(uninstaller_cmd, "w", encoding="utf-8") as f:
                f.write(uninstall_content)

            self._set_progress(75, f"{verb} ярлыков запуска..." if is_update else "Создание ярлыков...")
            if create_desktop:
                desktop_dir = Path.home() / "Desktop"
                if desktop_dir.is_dir():
                    desktop_lnk = str(desktop_dir / "YT Deck.lnk")
                    create_windows_shortcut(dest_exe, desktop_lnk, dest_icon, "YT Deck — Загрузчик YouTube")

            if create_startmenu:
                appdata = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
                programs_dir = Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
                if programs_dir.is_dir():
                    start_lnk = str(programs_dir / "YT Deck.lnk")
                    create_windows_shortcut(dest_exe, start_lnk, dest_icon, "YT Deck — Загрузчик YouTube")

            if register_app:
                self._set_progress(90, f"{verb} сведений о версии в Windows...")
                register_in_windows_uninstall(target_dir, dest_exe, uninstaller_cmd, version=INSTALLER_VERSION)

            self._set_progress(100, f"{verb} успешно завершено!" if is_update else "Установка успешно завершена!")
            time.sleep(0.4)
            self._notify_finished(True)
        except Exception as e:
            self._notify_finished(False, str(e))

    def finish_and_launch(self, should_launch):
        if should_launch and self.installed_exe_path and os.path.isfile(self.installed_exe_path):
            try:
                subprocess.Popen(
                    [self.installed_exe_path],
                    cwd=os.path.dirname(self.installed_exe_path),
                    creationflags=subprocess.DETACHED_PROCESS if sys.platform == "win32" else 0,
                    close_fds=True
                )
            except Exception as e:
                print(f"Error launching installed app: {e}")
        self.close()


def run_installer():
    import webview

    html_file = os.path.join(INSTALLER_DIR, "installer.html")
    with open(html_file, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Inline CSS & JS if local files
    css_file = os.path.join(INSTALLER_DIR, "installer.css")
    if os.path.isfile(css_file):
        with open(css_file, "r", encoding="utf-8") as f:
            css_content = f.read()
        html_content = html_content.replace(
            '<link rel="stylesheet" href="installer.css">',
            f'<style>{css_content}</style>'
        )

    js_file = os.path.join(INSTALLER_DIR, "installer.js")
    if os.path.isfile(js_file):
        with open(js_file, "r", encoding="utf-8") as f:
            js_content = f.read()
        html_content = html_content.replace(
            '<script src="installer.js"></script>',
            f'<script>{js_content}</script>'
        )

    window_holder = [None]
    api = InstallerApi(window_holder)

    is_update_flag = "/update" in sys.argv or "--update" in sys.argv
    initial_info = scan_existing_installation()
    initial_title = "Обновление YT Deck" if (is_update_flag or initial_info.get("found")) else "Установка YT Deck"

    window = webview.create_window(
        title=initial_title,
        html=html_content,
        js_api=api,
        width=680,
        height=520,
        resizable=False,
        background_color="#141218",
        text_select=False,
    )
    window_holder[0] = window

    webview.start(debug=False)


if __name__ == "__main__":
    run_installer()
