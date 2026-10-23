import os
import re
import sys
import time
import subprocess
import urllib.request
from flask import Blueprint, render_template, request, jsonify, send_from_directory

import yt_dlp
from picker import pick_with_powershell, pick_with_tkinter
from core.config import (
    APP_VERSION,
    BIN_DIR,
    DEFAULT_DOWNLOAD_DIR,
    load_config,
    save_config,
)
from core.engine import (
    find_ffmpeg,
    ffmpeg_available,
    get_ytdlp_version,
    build_base_ydl_opts,
    format_user_friendly_error,
    human_views,
    human_size,
    format_upload_date,
    parse_audio_track,
    get_codec_label,
    get_resolution_label,
    LANGUAGE_NAMES,
    is_playlist_url,
)
from core.queue_manager import (
    QUEUE,
    get_queue_state,
    save_queue_to_disk,
    enqueue_single_item,
    enqueue_batch_urls,
    enqueue_playlist,
    probe_playlist_info,
    handle_queue_action,
    QUEUE_SETTINGS,
    QUEUE_LOCK,
    JOBS,
    JOBS_LOCK,
)
from services.updater import (
    update_ytdlp_engine,
    download_ffmpeg_engine,
    check_app_update,
    download_and_launch_installer,
)

api_bp = Blueprint("api", __name__)


def choose_directory(initial_dir=None):
    base_dir = initial_dir if (initial_dir and os.path.isdir(initial_dir)) else DEFAULT_DOWNLOAD_DIR
    try:
        if sys.platform == "win32":
            folder = pick_with_powershell(base_dir)
            if folder:
                return folder
        return pick_with_tkinter(base_dir)
    except Exception as e:
        print(f"Folder picker error: {e}")
    return None


@api_bp.route("/")
def index():
    cfg = load_config()
    current_dir = cfg.get("default_dir") or DEFAULT_DOWNLOAD_DIR
    return render_template(
        "index.html",
        default_dir=current_dir,
        ffmpeg_ok=ffmpeg_available(),
        version=int(time.time()),
        config=cfg,
        ytdlp_version=get_ytdlp_version(),
        app_version=APP_VERSION,
        language=cfg.get("language", "ru"),
    )


@api_bp.route("/api/settings", methods=["GET", "POST"])
def handle_settings():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        updated = save_config(data)
        if updated:
            return jsonify({"ok": True, "settings": updated})
        return jsonify({"ok": False, "error": "Не удалось сохранить настройки"}), 500
    return jsonify({"ok": True, "settings": load_config()})


@api_bp.route("/api/job/<job_id>", methods=["GET"])
def get_job_status_endpoint(job_id):
    with QUEUE_LOCK:
        item = next((it for it in QUEUE if it["id"] == job_id), None)
        if item:
            return jsonify({"ok": True, "job": item})
    with JOBS_LOCK:
        j = JOBS.get(job_id)
        if j:
            return jsonify({"ok": True, "job": j})
    return jsonify({"ok": False, "error": "Задача не найдена"}), 404


@api_bp.route("/api/status", methods=["GET"])
def get_status():
    cfg = load_config()
    return jsonify({
        "ok": True,
        "ffmpeg_ok": ffmpeg_available(),
        "ffmpeg_path": find_ffmpeg(),
        "ytdlp_version": get_ytdlp_version(),
        "default_dir": cfg.get("default_dir") or DEFAULT_DOWNLOAD_DIR,
        "settings": cfg,
    })


@api_bp.route("/api/engine/status", methods=["GET"])
def engine_status():
    return jsonify({
        "ok": True,
        "ytdlp_version": get_ytdlp_version(),
        "ffmpeg_ok": ffmpeg_available(),
        "ffmpeg_path": find_ffmpeg(),
        "is_frozen": getattr(sys, "frozen", False),
    })


@api_bp.route("/api/engine/update-ytdlp", methods=["POST"])
def update_ytdlp():
    res = update_ytdlp_engine(BIN_DIR)
    status_code = 200 if res.get("ok") else 500
    return jsonify(res), status_code


@api_bp.route("/api/engine/download-ffmpeg", methods=["POST"])
def download_ffmpeg_endpoint():
    res = download_ffmpeg_engine(BIN_DIR)
    status_code = 200 if res.get("ok") else 500
    return jsonify(res), status_code


@api_bp.route("/api/app_update", methods=["GET"])
def get_app_update():
    res = check_app_update()
    status_code = 200 if res.get("ok") else 500
    return jsonify(res), status_code


@api_bp.route("/api/app_update/apply", methods=["POST"])
def apply_app_update():
    data = request.get_json(silent=True) or {}
    asset_url = data.get("asset_url")
    res = download_and_launch_installer(asset_url)
    status_code = 200 if res.get("ok") else 500
    return jsonify(res), status_code


@api_bp.route("/api/select-folder", methods=["POST"])
def select_folder():
    data = request.get_json(silent=True) or {}
    current = data.get("current_folder") or DEFAULT_DOWNLOAD_DIR
    folder = choose_directory(current)
    if folder:
        return jsonify({"ok": True, "folder": folder})
    return jsonify({"ok": False, "cancelled": True})


@api_bp.route("/api/probe", methods=["POST"])
def probe():
    data = request.get_json(force=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Вставьте ссылку на видео."}), 400

    cfg = load_config()
    proxy = data.get("proxy", "").strip()

    # Task 5: Handle playlist URLs with preview metadata
    if is_playlist_url(url):
        try:
            pl_info = probe_playlist_info(url, proxy)
            return jsonify(pl_info)
        except Exception as e_pl:
            return jsonify({"ok": False, "error": format_user_friendly_error(str(e_pl))}), 400

    ydl_opts = build_base_ydl_opts(cfg, proxy)
    ydl_opts.update({
        "skip_download": True,
        "noplaylist": True,
    })

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        # Fallback without cookies if browser cookies failed or locked
        if "cookiesfrombrowser" in ydl_opts:
            ydl_opts.pop("cookiesfrombrowser", None)
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
            except Exception as e2:
                return jsonify({"ok": False, "error": format_user_friendly_error(str(e2))}), 400
        else:
            return jsonify({"ok": False, "error": format_user_friendly_error(str(e))}), 400

    # Task 3.2: Check if live stream
    is_live = bool(info.get("is_live") or info.get("live_status") == "is_live")
    if is_live:
        return jsonify({
            "ok": False,
            "is_live": True,
            "error": "Это прямая трансляция (Live Stream). Автоматическая запись стримов отключена во избежание переполнения диска.",
        }), 400

    formats = info.get("formats", []) or []
    video_formats = {}
    raw_tracks = {}

    for f in formats:
        vcodec = f.get("vcodec")
        acodec = f.get("acodec")
        ext = f.get("ext")
        fmt_id = f.get("format_id")

        if vcodec and vcodec != "none":
            height = f.get("height") or 0
            width = f.get("width") or 0
            fps = f.get("fps") or 0
            codec_tag = get_codec_label(vcodec)
            res_tag = get_resolution_label(height, width)
            size = f.get("filesize") or f.get("filesize_approx")

            fps_str = f" {int(fps)}fps" if fps and fps > 30 else ""
            label_parts = [f"{height}p{fps_str}"]
            if res_tag and res_tag != f"{height}p":
                label_parts.append(res_tag)
            if codec_tag:
                label_parts.append(f"({codec_tag})")
            label_parts.append(ext.upper())

            candidate = {
                "format_id": fmt_id,
                "ext": ext,
                "height": height,
                "width": width,
                "fps": fps,
                "vcodec": vcodec,
                "codec_tag": codec_tag,
                "has_audio": acodec not in (None, "none"),
                "size": size,
                "size_h": human_size(size),
                "label": " · ".join(label_parts),
            }

            is_h264 = "h264" in vcodec.lower() or "avc1" in vcodec.lower()
            key = (height, fps > 30, is_h264, ext)

            existing = video_formats.get(key)
            if not existing or (size or 0) > (existing["size"] or 0):
                video_formats[key] = candidate

        elif acodec and acodec != "none" and (not vcodec or vcodec == "none"):
            if ext not in ("m4a", "webm", "mp3", "ogg", "opus"):
                continue

            tid, title, is_orig = parse_audio_track(f)
            if tid not in raw_tracks:
                raw_tracks[tid] = {
                    "id": tid,
                    "title": title,
                    "language": f.get("language") or "",
                    "is_original": is_orig,
                    "is_russian": tid.startswith("ru"),
                    "formats_map": {},
                }

            abr = f.get("abr") or 0
            f_key = (round(abr), ext)
            size = f.get("filesize") or f.get("filesize_approx")
            cand = {
                "format_id": fmt_id,
                "ext": ext,
                "abr": abr,
                "acodec": acodec,
                "size": size,
                "size_h": human_size(size),
                "label": f"{round(abr)} кбит/с · {ext.upper()}" if abr else f"Аудио · {ext.upper()}",
            }
            existing_f = raw_tracks[tid]["formats_map"].get(f_key)
            if not existing_f or (size or 0) > (existing_f["size"] or 0):
                raw_tracks[tid]["formats_map"][f_key] = cand

    video_list = sorted(video_formats.values(), key=lambda x: (x["height"], x["fps"], x["size"] or 0), reverse=True)

    def dedupe(lst, cap=12):
        out = []
        for item in lst:
            out.append(item)
            if len(out) >= cap:
                break
        return out

    video_list = dedupe(video_list)

    audio_tracks = []
    for t_data in raw_tracks.values():
        f_list = sorted(t_data["formats_map"].values(), key=lambda x: x["abr"], reverse=True)
        if f_list:
            audio_tracks.append({
                "id": t_data["id"],
                "title": t_data["title"],
                "language": t_data["language"],
                "is_original": t_data["is_original"],
                "is_russian": t_data["is_russian"],
                "formats": f_list,
            })

    def track_sort_key(t):
        if t["is_russian"]:
            return (0, t["title"])
        elif t["is_original"]:
            return (1, t["title"])
        else:
            return (2, t["title"])

    audio_tracks.sort(key=track_sort_key)
    default_audio_formats = audio_tracks[0]["formats"] if audio_tracks else []

    subtitles_dict = {}
    for lang_code, _ in (info.get("subtitles") or {}).items():
        name = LANGUAGE_NAMES.get(lang_code.lower()) or lang_code.upper()
        subtitles_dict[lang_code] = {"code": lang_code, "name": name, "auto": False}

    for lang_code, _ in (info.get("automatic_captions") or {}).items():
        if lang_code not in subtitles_dict:
            name = LANGUAGE_NAMES.get(lang_code.lower()) or lang_code.upper()
            subtitles_dict[lang_code] = {"code": lang_code, "name": f"{name} (авто)", "auto": True}

    def sub_sort_key(s):
        code = s["code"].lower()
        if code.startswith("ru"):
            return (0, s["name"])
        if code.startswith("en"):
            return (1, s["name"])
        return (2, s["name"])

    subtitles_list = sorted(subtitles_dict.values(), key=sub_sort_key)

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
        "duration_sec": duration,
        "views": human_views(info.get("view_count")),
        "upload_date": format_upload_date(info.get("upload_date")),
        "video_formats": video_list,
        "audio_tracks": audio_tracks,
        "audio_formats": default_audio_formats,
        "subtitles": subtitles_list,
    })


@api_bp.route("/api/queue", methods=["GET"])
def get_queue():
    return jsonify({"ok": True, "queue": get_queue_state()})


@api_bp.route("/api/queue/settings", methods=["POST"])
def update_queue_settings():
    data = request.get_json(force=True) or {}
    with QUEUE_LOCK:
        if "mode" in data:
            QUEUE_SETTINGS["mode"] = data["mode"]
            QUEUE_SETTINGS["concurrency"] = 1 if data["mode"] == "sequential" else 3
        if "concurrency" in data:
            QUEUE_SETTINGS["concurrency"] = max(1, min(5, int(data["concurrency"])))
        if "strategy" in data:
            QUEUE_SETTINGS["strategy"] = data["strategy"]
        if "speed_limit_mb" in data:
            QUEUE_SETTINGS["speed_limit_mb"] = max(0, int(data["speed_limit_mb"]))
        if "paused" in data:
            QUEUE_SETTINGS["paused"] = bool(data["paused"])

    save_queue_to_disk()

    from core.queue_manager import emit_socket
    emit_socket("queue_updated", get_queue_state())
    return jsonify({"ok": True, "settings": QUEUE_SETTINGS})


@api_bp.route("/api/queue/add", methods=["POST"])
def add_to_queue():
    data = request.get_json(force=True) or {}

    # Support adding a single item (from Deck tab)
    if "url" in data and "urls" not in data:
        url = data.get("url", "").strip()
        if not url:
            return jsonify({"ok": False, "error": "Ссылка отсутствует"}), 400

        item = enqueue_single_item(data, priority=data.get("priority", "normal"), insert_first=False)
        return jsonify({"ok": True, "added": 1 if item else 0, "queue": get_queue_state()})

    # Support batch list of URLs
    urls = data.get("urls", [])
    preset = data.get("preset", "best")
    target_dir = data.get("out_dir") or ""
    added_items = enqueue_batch_urls(urls, preset, target_dir)
    if not added_items:
        return jsonify({"ok": False, "error": "Не найдены корректные ссылки"}), 400

    return jsonify({"ok": True, "added": len(added_items), "queue": get_queue_state()})


@api_bp.route("/api/queue/action", methods=["POST"])
def queue_action():
    data = request.get_json(force=True) or {}
    action = data.get("action")
    item_id = data.get("item_id")
    state = handle_queue_action(action, item_id, extra=data)
    return jsonify({"ok": True, "queue": state})


@api_bp.route("/api/download", methods=["POST"])
def download():
    """
    Unified direct download entry point.
    Registers download as a high-priority task at the top of QueueManager.
    Completely eliminates duplicate download logic!
    """
    params = request.get_json(force=True) or {}
    if not params.get("url"):
        return jsonify({"ok": False, "error": "Нет ссылки на видео."}), 400

    # Register as high-priority item at the top of the queue
    item = enqueue_single_item(params, priority="high", insert_first=True)
    if not item:
        return jsonify({"ok": False, "error": "Ошибка инициализации загрузки."}), 500

    return jsonify({"ok": True, "job_id": item["id"]})


@api_bp.route("/api/queue/add-playlist", methods=["POST"])
def add_playlist():
    data = request.get_json(force=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Ссылка на плейлист отсутствует"}), 400

    preset = data.get("preset", "best")
    range_start = data.get("range_start", 1)
    range_end = data.get("range_end")
    out_dir = data.get("out_dir")
    proxy = data.get("proxy", "")

    try:
        added = enqueue_playlist(url, preset=preset, range_start=range_start, range_end=range_end, out_dir=out_dir, proxy=proxy)
        return jsonify({"ok": True, "added": len(added), "queue": get_queue_state()})
    except Exception as e:
        return jsonify({"ok": False, "error": format_user_friendly_error(str(e))}), 400


@api_bp.route("/api/download/cancel", methods=["POST"])
def cancel_download():
    data = request.get_json(force=True) or {}
    job_id = data.get("job_id")
    if not job_id:
        return jsonify({"ok": False, "error": "Идентификатор задачи не передан"}), 400

    handle_queue_action("item_cancel", item_id=job_id)
    return jsonify({"ok": True})


@api_bp.route("/api/download/thumbnail", methods=["POST"])
def download_thumbnail():
    data = request.get_json(force=True) or {}
    url = data.get("url")
    thumb_url = data.get("thumbnail_url")
    title = data.get("title", "cover")
    out_dir = data.get("out_dir") or DEFAULT_DOWNLOAD_DIR
    os.makedirs(out_dir, exist_ok=True)

    abs_out = os.path.abspath(out_dir)
    max_thumb_len = max(20, min(100, 240 - len(abs_out) - 15))
    safe_title = re.sub(r'[\\/*?:"<>|]', "", title).strip()[:max_thumb_len] or "cover"

    if not thumb_url and url:
        try:
            cfg = load_config()
            ydl_opts = build_base_ydl_opts(cfg, data.get("proxy", ""))
            ydl_opts.update({"skip_download": True, "noplaylist": True})
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                thumb_url = info.get("thumbnail")
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400

    if not thumb_url:
        return jsonify({"ok": False, "error": "Обложка не найдена"}), 404

    try:
        ext = "webp" if ".webp" in thumb_url else "jpg"
        file_path = os.path.join(out_dir, f"{safe_title} - cover.{ext}")
        req = urllib.request.Request(thumb_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp, open(file_path, "wb") as f_out:
            f_out.write(resp.read())

        return jsonify({
            "ok": True,
            "filename": os.path.basename(file_path),
            "folder": out_dir,
            "path": file_path,
        })
    except Exception as e:
        return jsonify({"ok": False, "error": f"Ошибка скачивания обложки: {e}"}), 400


@api_bp.route("/api/open-folder", methods=["POST"])
def open_folder():
    data = request.get_json(force=True) or {}
    folder = data.get("folder") or DEFAULT_DOWNLOAD_DIR
    os.makedirs(folder, exist_ok=True)
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


@api_bp.route("/api/open-file", methods=["POST"])
def open_file():
    data = request.get_json(force=True) or {}
    path = data.get("path")
    if not path or not os.path.exists(path):
        return jsonify({"ok": False, "error": "Файл не найден на диске"}), 404
    try:
        if sys.platform == "win32":
            os.startfile(os.path.normpath(path))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", path])
        else:
            subprocess.Popen(["xdg-open", path])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@api_bp.route("/api/highlight-file", methods=["POST"])
def highlight_file():
    data = request.get_json(force=True) or {}
    path = data.get("path")
    if not path or not os.path.exists(path):
        return jsonify({"ok": False, "error": "Файл не найден на диске"}), 404
    try:
        if sys.platform == "win32":
            subprocess.Popen(f'explorer /select,"{os.path.normpath(path)}"')
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", path])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(path)])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@api_bp.route("/api/file/<job_id>", methods=["GET"])
def get_file(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job or job.get("status") != "done":
        return jsonify({"ok": False, "error": "Файл ещё не готов или задача не найдена"}), 404
    file_path = job.get("path")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"ok": False, "error": "Файл не найден на диске"}), 404
    dir_name = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    return send_from_directory(dir_name, file_name, as_attachment=True)
