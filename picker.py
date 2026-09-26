"""
YT Deck — Автономный системный модуль выбора директории (Windows/macOS/Linux).
Запускается в изолированном процессе для корректного отображения диалогового окна поверх браузера.
"""
import os
import sys
import subprocess
import base64


def pick_with_powershell(initial_dir):
    """
    Открывает нативный Windows FolderBrowserDialog поверх всех окон с передачей пути через Base64
    для полной защиты от региональных проблем с кодировками (CP1251/CP866/UTF-8).
    """
    if sys.platform != "win32":
        return None

    try:
        escaped_dir = initial_dir.replace("'", "''")
        script = f"""
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Выберите папку для сохранения"
$init = '{escaped_dir}'
if ($init -and (Test-Path $init)) {{
    $dialog.SelectedPath = $init
}}
$dialog.ShowNewFolderButton = $true

$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.StartPosition = 'Manual'
$form.Location = New-Object System.Drawing.Point(-2000, -2000)
$form.Size = New-Object System.Drawing.Size(1, 1)
$form.Show()
$form.Activate()
$form.BringToFront()

$res = $dialog.ShowDialog($form)
$form.Close()
$form.Dispose()

if ($res -eq [System.Windows.Forms.DialogResult]::OK -and $dialog.SelectedPath) {{
    $b = [System.Text.Encoding]::UTF8.GetBytes($dialog.SelectedPath)
    [Console]::WriteLine("BASE64:" + [Convert]::ToBase64String($b))
}}
"""
        encoded_cmd = base64.b64encode(script.encode("utf-16le")).decode("ascii")

        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-EncodedCommand", encoded_cmd],
            capture_output=True,
            text=True,
            timeout=120
        )

        for line in res.stdout.splitlines():
            line = line.strip()
            if line.startswith("BASE64:"):
                b64_part = line.split("BASE64:", 1)[1].strip()
                folder = base64.b64decode(b64_part).decode("utf-8")
                if folder and os.path.isdir(folder):
                    return os.path.normpath(folder)
    except Exception as e:
        sys.stderr.write(f"PowerShell error: {e}\n")

    return None


def pick_with_tkinter(initial_dir):
    """
    Кроссплатформенный фоллбэк через Tkinter с topmost окном.
    """
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.wm_attributes("-topmost", 1)
        root.focus_force()
        folder = filedialog.askdirectory(
            initialdir=initial_dir,
            title="Выберите папку для сохранения"
        )
        root.destroy()
        if folder and os.path.isdir(folder):
            return os.path.normpath(folder)
    except Exception as e:
        sys.stderr.write(f"Tkinter error: {e}\n")
    return None


def main():
    initial_dir = sys.argv[1] if len(sys.argv) > 1 else ""
    if not (initial_dir and os.path.isdir(initial_dir)):
        initial_dir = os.path.expanduser("~")

    folder = None

    # На Windows приоритет у нативного PowerShell диалога
    if sys.platform == "win32":
        folder = pick_with_powershell(initial_dir)

    # Фоллбэк (или для Linux/macOS) — Tkinter
    if not folder:
        folder = pick_with_tkinter(initial_dir)

    if folder and os.path.isdir(folder):
        b = folder.encode("utf-8")
        print("BASE64:" + base64.b64encode(b).decode("ascii"))
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
