"""
YT Deck — локальный сервер-обёртка над yt-dlp с веб-интерфейсом.

Запуск:
    python server.py

Откроется на http://127.0.0.1:5000
Требуется установленный ffmpeg в PATH (для склейки видео+звук и конвертации аудио).
"""
import os
import re
import time
import uuid
import shutil
import threading
import subprocess
import sys
from pathlib import Path

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO

import yt_dlp

app = Flask(__name__)
app.config["SECRET_KEY"] = "yt-deck-local"
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

DEFAULT_DOWNLOAD_DIR = str(Path.home() / "Downloads" / "YT-Deck")
os.makedirs(DEFAULT_DOWNLOAD_DIR, exist_ok=True)

# In-memory registry of active/finished jobs
JOBS = {}


def human_size(num):
    if not num:
        return None
    for unit in ["Б", "КБ", "МБ", "ГБ"]:
        if num < 1024:
            return f"{num:.0f} {unit}" if unit == "Б" else f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} ТБ"


def ffmpeg_available():
    return shutil.which("ffmpeg") is not None


@app.route("/")
def index():
    return render_template("index.html", default_dir=DEFAULT_DOWNLOAD_DIR, ffmpeg_ok=ffmpeg_available())


@app.route("/api/probe", methods=["POST"])
def probe():
    data = request.get_json(force=True)
    url = (data or {}).get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Вставьте ссылку на видео."}), 400

    proxy = (data or {}).get("proxy", "").strip()

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }
    if proxy:
        ydl_opts["proxy"] = proxy

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        return jsonify({"ok": False, "error": f"Не удалось получить данные: {e}"}), 400

    formats = info.get("formats", []) or []

    video_formats = {}
    audio_formats = {}

    for f in formats:
        vcodec = f.get("vcodec")
        acodec = f.get("acodec")
        ext = f.get("ext")
        fmt_id = f.get("format_id")

        if vcodec and vcodec != "none":
            height = f.get("height") or 0
            fps = f.get("fps") or 0
            key = (height, ext)
            size = f.get("filesize") or f.get("filesize_approx")
            candidate = {
                "format_id": fmt_id,
                "ext": ext,
                "height": height,
                "fps": fps,
                "vcodec": vcodec,
                "has_audio": acodec not in (None, "none"),
                "size": size,
                "size_h": human_size(size),
                "label": f"{height}p" + (f" {int(fps)}fps" if fps and fps > 30 else "") + f" · {ext.upper()}",
            }
            # keep the best (largest size / with-audio bonus) per (height, ext)
            existing = video_formats.get(key)
            if not existing or (size or 0) > (existing["size"] or 0):
                video_formats[key] = candidate

        elif acodec and acodec != "none" and (not vcodec or vcodec == "none"):
            abr = f.get("abr") or 0
            key = (round(abr), ext)
            size = f.get("filesize") or f.get("filesize_approx")
            candidate = {
                "format_id": fmt_id,
                "ext": ext,
                "abr": abr,
                "acodec": acodec,
                "size": size,
                "size_h": human_size(size),
                "label": f"{round(abr)} кбит/с · {ext.upper()}" if abr else f"Аудио · {ext.upper()}",
            }
            existing = audio_formats.get(key)
            if not existing or (size or 0) > (existing["size"] or 0):
                audio_formats[key] = candidate

    video_list = sorted(video_formats.values(), key=lambda x: (x["height"], x["fps"]), reverse=True)
    audio_list = sorted(audio_formats.values(), key=lambda x: x["abr"], reverse=True)

    # De-dupe near-identical resolutions but keep format diversity (mp4/webm) capped
    def dedupe(lst, key_field, cap=9):
        seen = set()
        out = []
        for item in lst:
            k = (item[key_field], item["ext"])
            if k in seen:
                continue
            seen.add(k)
            out.append(item)
            if len(out) >= cap:
                break
        return out

    video_list = dedupe(video_list, "height")
    audio_list = dedupe(audio_list, "abr", cap=6)

    thumbnail = info.get("thumbnail")
    duration = info.get("duration") or 0
    mins, secs = divmod(int(duration), 60)
    hrs, mins = divmod(mins, 60)
    dur_str = f"{hrs:d}:{mins:02d}:{secs:02d}" if hrs else f"{mins:d}:{secs:02d}"

    return jsonify({
        "ok": True,
        "title": info.get("title"),
        "uploader": info.get("uploader"),
        "thumbnail": thumbnail,
        "duration": dur_str,
        "video_formats": video_list,
        "audio_formats": audio_list,
    })


def run_download(job_id, params):
    url = params["url"]
    mode = params["mode"]  # 'both' | 'video' | 'audio'
    video_id = params.get("video_format_id")
    audio_id = params.get("audio_format_id")
    container = params.get("container", "mp4")
    audio_codec = params.get("audio_codec", "mp3")
    out_dir = params.get("out_dir") or DEFAULT_DOWNLOAD_DIR
    proxy = (params.get("proxy") or "").strip()

    os.makedirs(out_dir, exist_ok=True)

    def hook(d):
        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            done = d.get("downloaded_bytes") or 0
            pct = (done / total * 100) if total else 0
            socketio.emit("progress", {
                "job_id": job_id,
                "status": "downloading",
                "percent": round(pct, 1),
                "speed": human_size(d.get("speed")) + "/с" if d.get("speed") else "—",
                "eta": d.get("eta"),
                "downloaded": human_size(done),
                "total": human_size(total),
            })
        elif status == "finished":
            socketio.emit("progress", {
                "job_id": job_id,
                "status": "merging",
                "percent": 99,
            })

    ydl_opts = {
        "outtmpl": os.path.join(out_dir, "%(title).150s.%(ext)s"),
        "progress_hooks": [hook],
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    if proxy:
        ydl_opts["proxy"] = proxy

    try:
        if mode == "both":
            ydl_opts["format"] = f"{video_id}+{audio_id}"
            ydl_opts["merge_output_format"] = container
        elif mode == "video":
            ydl_opts["format"] = video_id
        elif mode == "audio":
            ydl_opts["format"] = audio_id
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": audio_codec,
                "preferredquality": "0",
            }]

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)

        # Resolve the actual final filename after postprocessing/merging
        base, _ = os.path.splitext(filename)
        final_ext = audio_codec if mode == "audio" else container
        final_path = f"{base}.{final_ext}"
        if not os.path.exists(final_path):
            final_path = filename

        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["path"] = final_path
        socketio.emit("progress", {
            "job_id": job_id,
            "status": "done",
            "percent": 100,
            "filename": os.path.basename(final_path),
            "folder": out_dir,
        })
    except Exception as e:
        JOBS[job_id]["status"] = "error"
        socketio.emit("progress", {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        })


@app.route("/api/download", methods=["POST"])
def download():
    params = request.get_json(force=True)
    if not params.get("url"):
        return jsonify({"ok": False, "error": "Нет ссылки"}), 400

    job_id = uuid.uuid4().hex[:10]
    JOBS[job_id] = {"status": "starting", "params": params}
    t = threading.Thread(target=run_download, args=(job_id, params), daemon=True)
    t.start()
    return jsonify({"ok": True, "job_id": job_id})


@app.route("/api/open-folder", methods=["POST"])
def open_folder():
    data = request.get_json(force=True)
    folder = data.get("folder") or DEFAULT_DOWNLOAD_DIR
    try:
        if sys.platform == "win32":
            os.startfile(folder)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", folder])
        else:
            subprocess.Popen(["xdg-open", folder])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


if __name__ == "__main__":
    print("=" * 60)
    print(" YT Deck запущен: http://127.0.0.1:5000")
    print(f" Папка загрузок по умолчанию: {DEFAULT_DOWNLOAD_DIR}")
    if not ffmpeg_available():
        print(" ВНИМАНИЕ: ffmpeg не найден в PATH — склейка видео+звука")
        print(" и конвертация аудио работать не будут. Установите ffmpeg.")
    print("=" * 60)
    socketio.run(app, host="127.0.0.1", port=5000, debug=False, allow_unsafe_werkzeug=True)
