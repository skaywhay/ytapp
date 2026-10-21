import os
import re
import time
import uuid
import json
import shutil
import atexit
import threading
from concurrent.futures import ThreadPoolExecutor

import yt_dlp
from core.config import QUEUE_FILE, DEFAULT_DOWNLOAD_DIR, load_config
from core.engine import (
    build_base_ydl_opts,
    cleanup_temp_files,
    format_user_friendly_error,
    human_size,
    is_playlist_url,
)
from services.media_trim import trim_media_file, parse_time_str

QUEUE = []
QUEUE_LOCK = threading.RLock()
QUEUE_SETTINGS = {
    "mode": "sequential",      # "sequential" (1 stream) | "parallel" (3 streams)
    "concurrency": 1,           # 1 or 3
    "strategy": "size",         # "size" (SJF, smaller first) | "fifo" (by order) | "manual" (priority tags)
    "speed_limit_mb": 0,        # 0 = unlimited, otherwise in MB/s
    "paused": False,
}

# Main background thread pool
DOWNLOAD_EXECUTOR = ThreadPoolExecutor(max_workers=4)

# Bounded registry for API backward compatibility (max 50 completed items)
JOBS = {}
JOBS_LOCK = threading.RLock()

# Global reference to SocketIO for emissions from background workers
_socketio_instance = None

_last_save_time = 0.0
_save_timer = None
_save_lock = threading.RLock()


def set_socketio(sio):
    global _socketio_instance
    _socketio_instance = sio


def emit_socket(event, data):
    if _socketio_instance is not None:
        try:
            _socketio_instance.emit(event, data)
        except Exception as e:
            print(f"Socket emit error ({event}): {e}")


def _atomic_write_json(file_path, data):
    """Safely writes JSON to a temporary file and atomically replaces the target."""
    dir_name = os.path.dirname(file_path)
    os.makedirs(dir_name, exist_ok=True)
    temp_file = os.path.join(dir_name, f"{os.path.basename(file_path)}.{uuid.uuid4().hex[:8]}.tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(temp_file, file_path)


def load_queue_from_disk():
    global QUEUE, QUEUE_SETTINGS
    if os.path.isfile(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    saved_settings = data.get("settings", {})
                    QUEUE_SETTINGS.update(saved_settings)
                    QUEUE_SETTINGS["concurrency"] = 1 if QUEUE_SETTINGS.get("mode") == "sequential" else 3

                    raw_items = data.get("items", [])
                    cleaned_items = []
                    for it in raw_items:
                        # Reset interrupted downloads to paused to keep queue slots free for immediate downloads
                        if it.get("status") in ("downloading", "merging"):
                            it["status"] = "paused"
                        it["cancel_requested"] = False
                        it["pause_requested"] = False
                        cleaned_items.append(it)
                    QUEUE = cleaned_items
        except Exception as e:
            print(f"Error loading queue from disk: {e}")


def save_queue_to_disk(force=False):
    """
    Throttled atomic queue state persistence.
    Saves state to disk no more than once every 2 seconds during active downloads.
    Updates in real-time if force=True or via scheduled timer.
    """
    global _last_save_time, _save_timer
    now = time.time()
    with _save_lock:
        if force or (now - _last_save_time >= 2.0):
            if _save_timer:
                _save_timer.cancel()
                _save_timer = None
            _last_save_time = now
            with QUEUE_LOCK:
                payload = {
                    "settings": dict(QUEUE_SETTINGS),
                    "items": [dict(it) for it in QUEUE],
                }
            try:
                _atomic_write_json(QUEUE_FILE, payload)
            except Exception as e:
                print(f"Error saving queue atomically: {e}")
        else:
            if _save_timer is None:
                def deferred_save():
                    global _save_timer
                    save_queue_to_disk(force=True)
                    _save_timer = None
                _save_timer = threading.Timer(2.0, deferred_save)
                _save_timer.daemon = True
                _save_timer.start()


atexit.register(lambda: save_queue_to_disk(force=True))
load_queue_from_disk()


def get_queue_state():
    with QUEUE_LOCK:
        total = len(QUEUE)
        active = sum(1 for it in QUEUE if it.get("status") in ("downloading", "merging"))
        pending = sum(1 for it in QUEUE if it.get("status") == "pending")
        done = sum(1 for it in QUEUE if it.get("status") == "done")
        paused = sum(1 for it in QUEUE if it.get("status") == "paused")
        return {
            "items": [dict(it) for it in QUEUE],
            "settings": dict(QUEUE_SETTINGS),
            "stats": {
                "total": total,
                "active": active,
                "pending": pending,
                "done": done,
                "paused": paused,
            }
        }


def record_job_status(job_id, status, path=None, extra=None):
    with JOBS_LOCK:
        if job_id not in JOBS:
            JOBS[job_id] = {"created_at": time.time()}
        JOBS[job_id]["status"] = status
        if path:
            JOBS[job_id]["path"] = path
        if extra:
            JOBS[job_id].update(extra)

        # Evict old completed jobs beyond 50 entries
        terminal_jobs = [jid for jid, j in JOBS.items() if j.get("status") in ("done", "error", "cancelled")]
        if len(terminal_jobs) > 50:
            sorted_terminal = sorted(terminal_jobs, key=lambda k: JOBS[k].get("created_at", 0))
            for old_jid in sorted_terminal[:-50]:
                JOBS.pop(old_jid, None)


def run_queue_download(item_id):
    """
    Unified download execution engine for all downloads (direct from Deck tab & batch queue).
    Emits both 'queue_progress' and 'progress' socket events for unified real-time feedback.
    """
    with QUEUE_LOCK:
        item = next((it for it in QUEUE if it["id"] == item_id), None)
        if not item:
            return
        item["status"] = "downloading"
        item["error"] = ""
        item["cancel_requested"] = False
        item["pause_requested"] = False
        item_copy = dict(item)

    record_job_status(item_id, "downloading")

    url = item_copy["url"]
    title_hint = item_copy.get("title", "")
    mode = item_copy.get("mode", "both")
    video_id = item_copy.get("video_format_id")
    audio_id = item_copy.get("audio_format_id")
    container = item_copy.get("container", "mp4")
    audio_codec = item_copy.get("audio_codec", "mp3")
    out_dir = item_copy.get("out_dir") or DEFAULT_DOWNLOAD_DIR
    proxy = (item_copy.get("proxy") or "").strip()

    subtitles_enabled = item_copy.get("subtitles_enabled", False)
    subtitles_lang = item_copy.get("subtitles_lang", "ru")
    subtitles_embed = item_copy.get("subtitles_embed", False)

    trim_enabled = item_copy.get("trim_enabled", False)
    trim_start = item_copy.get("trim_start", "").strip()
    trim_end = item_copy.get("trim_end", "").strip()

    os.makedirs(out_dir, exist_ok=True)
    last_emit_time = [0.0]

    # Safety Guard: Check free disk space before starting download
    try:
        usage = shutil.disk_usage(out_dir)
        free_bytes = usage.free
        est_size = item_copy.get("estimated_size") or 0
        required_bytes = int(est_size * 1.2) if est_size > 0 else 500 * 1024 * 1024
        if free_bytes < required_bytes:
            req_mb = round(required_bytes / (1024 * 1024))
            free_mb = round(free_bytes / (1024 * 1024))
            raise OSError(f"Недостаточно места на диске для сохранения файла (требуется ~{req_mb} МБ, свободно {free_mb} МБ).")
    except OSError as oe:
        err_msg = str(oe)
        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if cur_item:
                cur_item["status"] = "error"
                cur_item["error"] = err_msg
        record_job_status(item_id, "error", extra={"error": err_msg})
        save_queue_to_disk(force=True)
        emit_socket("queue_updated", get_queue_state())
        emit_socket("progress", {
            "job_id": item_id,
            "status": "error",
            "error": err_msg,
        })
        return
    except Exception as e_space:
        print(f"Disk space check warning: {e_space}")

    emit_socket("progress", {
        "job_id": item_id,
        "status": "starting",
        "phase_label": "Подключение к YouTube…",
    })

    def hook(d):
        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if not cur_item or cur_item.get("cancel_requested"):
                raise yt_dlp.utils.DownloadCancelled("Загрузка отменена пользователем")
            if cur_item.get("pause_requested"):
                raise yt_dlp.utils.DownloadCancelled("Загрузка приостановлена пользователем")

        status = d.get("status")
        now = time.time()
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            done = d.get("downloaded_bytes") or 0
            pct = (done / total * 100) if total else 0
            speed_val = d.get("speed")
            speed_str = human_size(speed_val) + "/с" if speed_val else "—"
            eta = d.get("eta")
            dl_str = human_size(done)
            tot_str = human_size(total)

            info = d.get("info_dict") or {}
            vcodec = info.get("vcodec") or ""
            acodec = info.get("acodec") or ""
            if vcodec and vcodec != "none" and (not acodec or acodec == "none"):
                phase = "video"
                phase_label = f"Скачиваем видео ({round(pct)}%)"
            elif acodec and acodec != "none" and (not vcodec or vcodec == "none"):
                phase = "audio"
                phase_label = f"Скачиваем аудио ({round(pct)}%)"
            else:
                phase = "media"
                phase_label = f"Скачиваем ({round(pct)}%)"

            with QUEUE_LOCK:
                if cur_item:
                    cur_item["progress"] = round(pct, 1)
                    cur_item["speed"] = speed_str
                    cur_item["eta"] = eta
                    cur_item["downloaded"] = dl_str
                    cur_item["total"] = tot_str
                    cur_item["phase"] = phase

            if now - last_emit_time[0] >= 0.25:
                last_emit_time[0] = now
                progress_payload = {
                    "id": item_id,
                    "job_id": item_id,
                    "status": "downloading",
                    "percent": round(pct, 1),
                    "speed": speed_str,
                    "eta": eta,
                    "downloaded": dl_str,
                    "total": tot_str,
                    "phase": phase,
                    "phase_label": phase_label,
                }
                emit_socket("queue_progress", progress_payload)
                emit_socket("progress", progress_payload)

    def pp_hook(d):
        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if not cur_item or cur_item.get("cancel_requested"):
                raise yt_dlp.utils.DownloadCancelled("Загрузка отменена пользователем")
            if cur_item.get("pause_requested"):
                raise yt_dlp.utils.DownloadCancelled("Загрузка приостановлена пользователем")

        pp = d.get("postprocessor")
        st = d.get("status")
        if pp in ("Merger", "FFmpegVideoConvertor", "FFmpegExtractAudio", "FixupM3u8"):
            if st == "started":
                with QUEUE_LOCK:
                    if cur_item:
                        cur_item["status"] = "merging"
                        cur_item["progress"] = 99
                record_job_status(item_id, "merging")

                merging_payload = {
                    "id": item_id,
                    "job_id": item_id,
                    "status": "merging",
                    "percent": 99,
                    "phase": "ffmpeg",
                    "stage_text": "Склейка дорожек через FFmpeg. Для длинных видео это может занять 1–2 минуты, пожалуйста, подождите…",
                    "message": "Склейка дорожек через FFmpeg. Для длинных видео это может занять 1–2 минуты, пожалуйста, подождите…",
                }
                emit_socket("queue_progress", merging_payload)
                emit_socket("progress", merging_payload)

    # Windows MAX_PATH safety: Limit filename to ensure total path <= 250 characters
    abs_out = os.path.abspath(out_dir)
    max_title_len = max(20, min(150, 240 - len(abs_out) - 10))

    cfg = load_config()
    ydl_opts = build_base_ydl_opts(cfg, proxy)
    ydl_opts.update({
        "outtmpl": os.path.join(out_dir, f"%(title).{max_title_len}s.%(ext)s"),
        "progress_hooks": [hook],
        "postprocessor_hooks": [pp_hook],
        "postprocessor_args": {
            "Merger": ["-nostdin", "-threads", "0"],
        },
        "noplaylist": True,
        "continuedl": True,
    })

    # Safety Guard: Live stream protection
    def live_stream_filter(info_dict, incomplete=False):
        if info_dict.get("is_live") or info_dict.get("live_status") == "is_live":
            return "Прямая трансляция (Live Stream). Автоматическая запись стримов отключена во избежание переполнения диска."
        return None

    ydl_opts["match_filter"] = live_stream_filter

    # Speed limit distribution
    speed_mb = QUEUE_SETTINGS.get("speed_limit_mb", 0)
    if speed_mb > 0:
        with QUEUE_LOCK:
            active_items = [it for it in QUEUE if it.get("status") in ("downloading", "merging")]
            prio_weights = {"high": 3, "normal": 2, "low": 1}
            total_weight = sum(prio_weights.get(it.get("priority", "normal"), 2) for it in active_items) or 1
            item_weight = prio_weights.get(item_copy.get("priority", "normal"), 2)
            share_ratio = item_weight / total_weight
            rate_bytes = int(speed_mb * 1024 * 1024 * share_ratio)
            ydl_opts["ratelimit"] = max(100 * 1024, rate_bytes)

    # Subtitles configuration
    if subtitles_enabled and subtitles_lang:
        ydl_opts["writesubtitles"] = True
        ydl_opts["writeautomaticsub"] = True
        ydl_opts["subtitleslangs"] = [subtitles_lang]
        if subtitles_embed and mode in ("both", "video") and container in ("mp4", "mkv", "webm"):
            ydl_opts.setdefault("postprocessors", []).append({
                "key": "FFmpegEmbedSubtitle",
                "already_have_subtitle": False,
            })
        else:
            ydl_opts.setdefault("postprocessors", []).append({
                "key": "FFmpegSubtitlesConvertor",
                "format": "srt",
            })

    try:
        # Normalize format selectors
        v_sel = video_id if (video_id and video_id not in ("best", "auto")) else ""
        a_sel = audio_id if (audio_id and audio_id not in ("best", "auto")) else ""

        # Determine format selection
        if mode == "both":
            if v_sel and a_sel:
                ydl_opts["format"] = f"{v_sel}+{a_sel}/{v_sel}+bestaudio/bestvideo+bestaudio/best"
            elif v_sel:
                if container == "mp4":
                    ydl_opts["format"] = f"{v_sel}+bestaudio[ext=m4a]/{v_sel}+bestaudio/best"
                else:
                    ydl_opts["format"] = f"{v_sel}+bestaudio/best"
            else:
                if container == "mp4":
                    ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
                elif container == "webm":
                    ydl_opts["format"] = "bestvideo[ext=webm]+bestaudio[ext=webm]/bestvideo+bestaudio/best"
                else:
                    ydl_opts["format"] = "bestvideo+bestaudio/best"
            ydl_opts["merge_output_format"] = container
        elif mode == "video":
            ydl_opts["format"] = f"{v_sel}/bestvideo/best" if v_sel else "bestvideo/best"
        elif mode == "audio":
            if a_sel:
                ydl_opts["format"] = f"{a_sel}/bestaudio/best"
            else:
                if audio_codec in ("m4a", "aac"):
                    ydl_opts["format"] = "bestaudio[ext=m4a]/bestaudio/best"
                elif audio_codec == "opus":
                    ydl_opts["format"] = "bestaudio[ext=webm]/bestaudio/best"
                else:
                    ydl_opts["format"] = "bestaudio/best"
            ydl_opts.setdefault("postprocessors", []).append({
                "key": "FFmpegExtractAudio",
                "preferredcodec": audio_codec,
                "preferredquality": "0",
            })

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
        except Exception as dl_ex:
            # Fallback if browser cookies caused lock or authentication failure
            if "cookiesfrombrowser" in ydl_opts:
                print(f"Retrying download without browser cookies: {dl_ex}")
                ydl_opts.pop("cookiesfrombrowser", None)
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    filename = ydl.prepare_filename(info)
            else:
                raise dl_ex

        base, _ = os.path.splitext(filename)
        final_ext = audio_codec if mode == "audio" else container
        final_path = f"{base}.{final_ext}"
        if not os.path.exists(final_path):
            final_path = filename

        # Apply local timecode trim safely via ffmpeg after native download
        if trim_enabled and (trim_start or trim_end):
            trim_payload = {
                "id": item_id,
                "job_id": item_id,
                "status": "merging",
                "percent": 99,
                "phase": "ffmpeg",
                "stage_text": "Точная обрезка клипа через FFmpeg…",
                "message": "Точная обрезка клипа через FFmpeg…",
            }
            emit_socket("queue_progress", trim_payload)
            emit_socket("progress", trim_payload)
            final_path = trim_media_file(final_path, trim_start, trim_end)

        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if cur_item:
                cur_item["status"] = "done"
                cur_item["progress"] = 100
                cur_item["file_path"] = final_path
                cur_item["filename"] = os.path.basename(final_path)

        record_job_status(item_id, "done", path=final_path)
        save_queue_to_disk(force=True)

        emit_socket("queue_updated", get_queue_state())
        emit_socket("progress", {
            "job_id": item_id,
            "status": "done",
            "percent": 100,
            "filename": os.path.basename(final_path),
            "folder": out_dir,
            "path": final_path,
        })
    except yt_dlp.utils.DownloadCancelled:
        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if cur_item:
                if cur_item.get("pause_requested"):
                    cur_item["status"] = "paused"
                    cur_item["pause_requested"] = False
                    cur_item["speed"] = ""
                    cur_item["eta"] = None
                    record_job_status(item_id, "paused")
                else:
                    cur_item["status"] = "cancelled"
                    record_job_status(item_id, "cancelled")
                    cleanup_temp_files(out_dir, title_hint)

        save_queue_to_disk(force=True)
        emit_socket("queue_updated", get_queue_state())
        emit_socket("progress", {
            "job_id": item_id,
            "status": "cancelled",
            "message": "Загрузка отменена пользователем",
        })
    except Exception as e:
        err_msg = format_user_friendly_error(str(e))
        with QUEUE_LOCK:
            cur_item = next((it for it in QUEUE if it["id"] == item_id), None)
            if cur_item:
                cur_item["status"] = "error"
                cur_item["error"] = err_msg

        cleanup_temp_files(out_dir, title_hint)
        record_job_status(item_id, "error", extra={"error": err_msg})
        save_queue_to_disk(force=True)
        emit_socket("queue_updated", get_queue_state())
        emit_socket("progress", {
            "job_id": item_id,
            "status": "error",
            "error": err_msg,
        })


def enqueue_single_item(params, priority="normal", insert_first=False):
    """
    Registers a single item into the unified queue.
    If priority is 'high' or insert_first is True, it is inserted at the front of the queue
    for immediate execution by the dispatcher.
    """
    url = params.get("url", "").strip()
    if not url:
        return None

    cfg = load_config()
    default_dir = cfg.get("default_dir") or DEFAULT_DOWNLOAD_DIR
    job_id = params.get("job_id") or uuid.uuid4().hex[:10]

    with QUEUE_LOCK:
        order_idx = len(QUEUE)
        new_item = {
            "id": job_id,
            "url": url,
            "title": params.get("title") or "YouTube видео",
            "uploader": params.get("uploader") or "",
            "thumbnail": params.get("thumbnail") or "",
            "duration": params.get("duration") or "",
            "duration_sec": params.get("duration_sec") or 0,
            "estimated_size": params.get("estimated_size") or 0,
            "mode": params.get("mode") or "both",
            "video_format_id": params.get("video_format_id") or "",
            "audio_format_id": params.get("audio_format_id") or "",
            "container": params.get("container") or "mp4",
            "audio_codec": params.get("audio_codec") or "mp3",
            "out_dir": params.get("out_dir") or default_dir,
            "proxy": params.get("proxy") or "",
            "subtitles_enabled": params.get("subtitles_enabled", False),
            "subtitles_lang": params.get("subtitles_lang", "ru"),
            "subtitles_embed": params.get("subtitles_embed", False),
            "trim_enabled": params.get("trim_enabled", False),
            "trim_start": params.get("trim_start", ""),
            "trim_end": params.get("trim_end", ""),
            "priority": priority,
            "order": 0 if insert_first else order_idx,
            "status": "pending",
            "progress": 0,
            "speed": "",
            "eta": None,
            "downloaded": "",
            "total": "",
            "filename": "",
            "file_path": "",
            "error": "",
            "cancel_requested": False,
            "pause_requested": False,
            "created_at": time.time(),
        }

        if insert_first:
            # Direct Deck download: prioritize and mark active immediately
            new_item["status"] = "downloading"
            QUEUE.insert(0, new_item)
        else:
            QUEUE.append(new_item)

    save_queue_to_disk(force=True)

    record_job_status(job_id, "downloading" if insert_first else "starting", extra={"params": params})
    emit_socket("queue_updated", get_queue_state())

    if insert_first:
        emit_socket("progress", {
            "job_id": job_id,
            "status": "starting",
            "phase_label": "Подключение к YouTube…",
        })
        DOWNLOAD_EXECUTOR.submit(run_queue_download, job_id)

    return new_item


def probe_playlist_info(url, proxy=""):
    """
    Flat metadata probe for playlists.
    Returns playlist overview: title, uploader, thumbnail, total item count and sample entries.
    """
    cfg = load_config()
    opts = build_base_ydl_opts(cfg, proxy)
    opts.update({
        "extract_flat": True,
        "skip_download": True,
        "quiet": True,
        "socket_timeout": 15,
    })
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    entries = list(info.get("entries") or []) if info else []
    valid_entries = []
    for idx, e in enumerate(entries):
        if not e or e.get("title") in ("[Private video]", "[Deleted video]"):
            continue
        vid_id = e.get("id") or ""
        vid_url = e.get("url") or ""
        if not vid_url.startswith("http"):
            if vid_id:
                vid_url = f"https://www.youtube.com/watch?v={vid_id}"
            else:
                continue
        dur = e.get("duration") or 0
        mins, secs = divmod(int(dur), 60)
        hrs, mins = divmod(mins, 60)
        dur_str = f"{hrs:d}:{mins:02d}:{secs:02d}" if hrs else (f"{mins:d}:{secs:02d}" if dur else "")
        thumb = e.get("thumbnail") or ""
        if not thumb and e.get("thumbnails"):
            thumb = e["thumbnails"][-1].get("url") or ""

        valid_entries.append({
            "index": idx + 1,
            "id": vid_id,
            "url": vid_url,
            "title": e.get("title") or f"Видео #{idx + 1}",
            "uploader": e.get("uploader") or info.get("uploader") or "YouTube",
            "duration": dur_str,
            "duration_sec": dur,
            "thumbnail": thumb,
        })

    thumb = info.get("thumbnail") or (valid_entries[0]["thumbnail"] if valid_entries else "")
    return {
        "ok": True,
        "is_playlist": True,
        "url": url,
        "title": info.get("title") or "YouTube Плейлист",
        "uploader": info.get("uploader") or info.get("channel") or "YouTube",
        "thumbnail": thumb,
        "total_count": len(valid_entries),
        "entries": valid_entries[:50],
    }


def enqueue_playlist(url, preset="best", range_start=1, range_end=None, out_dir="", proxy=""):
    """
    Enqueues a specified range of videos from a playlist into the background queue.
    """
    cfg = load_config()
    default_dir = cfg.get("default_dir") or DEFAULT_DOWNLOAD_DIR
    target_dir = out_dir or default_dir

    def resolve_preset_params(p):
        if p == "audio":
            return {"mode": "audio", "container": "mp3", "audio_codec": "mp3"}
        elif p == "1080p":
            return {"mode": "both", "container": "mp4", "video_format_id": "bestvideo[height<=1080]"}
        elif p == "720p":
            return {"mode": "both", "container": "mp4", "video_format_id": "bestvideo[height<=720]"}
        return {"mode": "both", "container": "mp4"}

    p_params = resolve_preset_params(preset)

    opts = build_base_ydl_opts(cfg, proxy)
    opts.update({
        "extract_flat": True,
        "skip_download": True,
        "quiet": True,
        "socket_timeout": 20,
    })
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    entries = list(info.get("entries") or []) if info else []
    pl_title = info.get("title") or "Плейлист"
    pl_uploader = info.get("uploader") or info.get("channel") or "YouTube"

    r_start = max(1, int(range_start or 1))
    r_end = int(range_end) if range_end else len(entries)
    r_end = max(r_start, min(len(entries), r_end))

    selected_entries = entries[r_start - 1 : r_end]
    items_added = []

    with QUEUE_LOCK:
        for idx, entry in enumerate(selected_entries, start=r_start):
            if not entry or entry.get("title") in ("[Private video]", "[Deleted video]"):
                continue
            vid_id = entry.get("id") or ""
            vid_url = entry.get("url") or ""
            if not vid_url.startswith("http"):
                if vid_id:
                    vid_url = f"https://www.youtube.com/watch?v={vid_id}"
                else:
                    continue

            dur = entry.get("duration") or 0
            mins, secs = divmod(int(dur), 60)
            hrs, mins = divmod(mins, 60)
            dur_str = f"{hrs:d}:{mins:02d}:{secs:02d}" if hrs else (f"{mins:d}:{secs:02d}" if dur else "")

            thumb = entry.get("thumbnail") or ""
            if not thumb and entry.get("thumbnails"):
                thumb = entry["thumbnails"][-1].get("url") or ""

            order_idx = len(QUEUE)
            new_item = {
                "id": uuid.uuid4().hex[:10],
                "url": vid_url,
                "title": entry.get("title") or f"{pl_title} · #{idx}",
                "uploader": entry.get("uploader") or pl_uploader,
                "thumbnail": thumb,
                "duration": dur_str,
                "duration_sec": dur,
                "estimated_size": 0,
                "mode": p_params.get("mode", "both"),
                "video_format_id": p_params.get("video_format_id", ""),
                "audio_format_id": "",
                "container": p_params.get("container", "mp4"),
                "audio_codec": p_params.get("audio_codec", "mp3"),
                "out_dir": target_dir,
                "proxy": proxy,
                "priority": "normal",
                "order": order_idx,
                "status": "pending",
                "progress": 0,
                "speed": "",
                "eta": None,
                "downloaded": "",
                "total": "",
                "filename": "",
                "file_path": "",
                "error": "",
                "cancel_requested": False,
                "pause_requested": False,
                "created_at": time.time(),
            }
            QUEUE.append(new_item)
            items_added.append(new_item)

    save_queue_to_disk(force=True)
    emit_socket("queue_updated", get_queue_state())
    return items_added


def enqueue_batch_urls(urls_text_or_list, preset="best", out_dir=""):
    cfg = load_config()
    default_dir = cfg.get("default_dir") or DEFAULT_DOWNLOAD_DIR
    target_dir = out_dir or default_dir

    if isinstance(urls_text_or_list, str):
        urls = re.findall(r'https?://[^\s,;"\']+', urls_text_or_list)
    else:
        urls = list(urls_text_or_list or [])

    if not urls:
        return []

    def resolve_preset_params(p):
        if p == "audio":
            return {"mode": "audio", "container": "mp3", "audio_codec": "mp3"}
        elif p == "1080p":
            return {"mode": "both", "container": "mp4", "video_format_id": "bestvideo[height<=1080]"}
        elif p == "720p":
            return {"mode": "both", "container": "mp4", "video_format_id": "bestvideo[height<=720]"}
        return {"mode": "both", "container": "mp4"}

    p_params = resolve_preset_params(preset)
    items_added = []
    items_to_probe = []

    for url_entry in urls:
        u = url_entry.strip()
        if not u:
            continue

        if is_playlist_url(u):
            try:
                pl_items = enqueue_playlist(u, preset=preset, out_dir=target_dir)
                items_added.extend(pl_items)
                continue
            except Exception as e:
                print(f"Playlist unfolding note for {u}: {e}")

        # Normal single URL addition
        with QUEUE_LOCK:
            order_idx = len(QUEUE)
            new_item = {
                "id": uuid.uuid4().hex[:10],
                "url": u,
                "title": f"Очередь #{order_idx + 1}",
                "uploader": "YouTube",
                "thumbnail": "",
                "duration": "",
                "duration_sec": 0,
                "estimated_size": 0,
                "mode": p_params.get("mode", "both"),
                "video_format_id": p_params.get("video_format_id", ""),
                "audio_format_id": "",
                "container": p_params.get("container", "mp4"),
                "audio_codec": p_params.get("audio_codec", "mp3"),
                "out_dir": target_dir,
                "priority": "normal",
                "order": order_idx,
                "status": "pending",
                "progress": 0,
                "speed": "",
                "eta": None,
                "downloaded": "",
                "total": "",
                "filename": "",
                "file_path": "",
                "error": "",
                "cancel_requested": False,
                "pause_requested": False,
                "created_at": time.time(),
            }
            QUEUE.append(new_item)
            items_added.append(new_item)
            items_to_probe.append(new_item)

    save_queue_to_disk()
    emit_socket("queue_updated", get_queue_state())

    def resolve_metadata_batch(items_to_resolve):
        if not items_to_resolve:
            return
        c = load_config()
        opts = build_base_ydl_opts(c)
        opts.update({"skip_download": True, "extract_flat": True, "quiet": True})
        with yt_dlp.YoutubeDL(opts) as ydl:
            for it in items_to_resolve:
                try:
                    info = ydl.extract_info(it["url"], download=False)
                    with QUEUE_LOCK:
                        target = next((x for x in QUEUE if x["id"] == it["id"]), None)
                        if target:
                            target["title"] = info.get("title") or target["title"]
                            target["uploader"] = info.get("uploader") or target["uploader"]
                            dur = info.get("duration") or 0
                            mins, secs = divmod(int(dur), 60)
                            hrs, mins = divmod(mins, 60)
                            target["duration"] = f"{hrs:d}:{mins:02d}:{secs:02d}" if hrs else f"{mins:d}:{secs:02d}"
                            target["duration_sec"] = dur
                            thumb = info.get("thumbnail") or (info.get("thumbnails") and info.get("thumbnails")[-1].get("url"))
                            if thumb:
                                target["thumbnail"] = thumb
                    save_queue_to_disk(force=True)
                    emit_socket("queue_updated", get_queue_state())
                except Exception as e:
                    print(f"Flat probe note for {it['url']}: {e}")

    if items_to_probe:
        threading.Thread(target=resolve_metadata_batch, args=(items_to_probe,), daemon=True).start()

    return items_added


def handle_queue_action(action, item_id=None, extra=None):
    global QUEUE
    extra = extra or {}

    with QUEUE_LOCK:
        if action == "pause_all":
            QUEUE_SETTINGS["paused"] = True
            for it in QUEUE:
                if it.get("status") == "pending":
                    it["status"] = "paused"
                elif it.get("status") in ("downloading", "merging"):
                    it["pause_requested"] = True
        elif action == "resume_all":
            QUEUE_SETTINGS["paused"] = False
            for it in QUEUE:
                if it.get("status") == "paused":
                    it["status"] = "pending"
                    it["pause_requested"] = False
        elif action == "clear_completed":
            QUEUE = [it for it in QUEUE if it.get("status") not in ("done", "cancelled")]
        elif action == "item_priority":
            new_prio = extra.get("priority", "normal")
            target = next((it for it in QUEUE if it["id"] == item_id), None)
            if target:
                target["priority"] = new_prio
        elif action == "item_pause":
            target = next((it for it in QUEUE if it["id"] == item_id), None)
            if target:
                if target.get("status") == "pending":
                    target["status"] = "paused"
                elif target.get("status") in ("downloading", "merging"):
                    target["pause_requested"] = True
        elif action == "item_resume":
            target = next((it for it in QUEUE if it["id"] == item_id), None)
            if target and target.get("status") in ("paused", "cancelled", "error"):
                target["status"] = "pending"
                target["error"] = ""
                target["cancel_requested"] = False
                target["pause_requested"] = False
                if QUEUE_SETTINGS.get("paused"):
                    QUEUE_SETTINGS["paused"] = False
        elif action == "item_cancel":
            target = next((it for it in QUEUE if it["id"] == item_id), None)
            if target:
                target["cancel_requested"] = True
                if target.get("status") in ("downloading", "merging"):
                    target["status"] = "cancelled"
                elif target.get("status") in ("pending", "paused"):
                    target["status"] = "cancelled"
                    cleanup_temp_files(target.get("out_dir") or DEFAULT_DOWNLOAD_DIR, target.get("title", ""))
            record_job_status(item_id, "cancelled")
            emit_socket("progress", {
                "job_id": item_id,
                "status": "cancelled",
                "message": "Загрузка отменена",
            })
        elif action == "item_delete":
            target = next((it for it in QUEUE if it["id"] == item_id), None)
            if target:
                target["cancel_requested"] = True
                cleanup_temp_files(target.get("out_dir") or DEFAULT_DOWNLOAD_DIR, target.get("title", ""))
                QUEUE = [it for it in QUEUE if it["id"] != item_id]
        elif action == "move_up":
            idx = next((i for i, it in enumerate(QUEUE) if it["id"] == item_id), None)
            if idx is not None and idx > 0:
                QUEUE[idx], QUEUE[idx - 1] = QUEUE[idx - 1], QUEUE[idx]
        elif action == "move_down":
            idx = next((i for i, it in enumerate(QUEUE) if it["id"] == item_id), None)
            if idx is not None and idx < len(QUEUE) - 1:
                QUEUE[idx], QUEUE[idx + 1] = QUEUE[idx + 1], QUEUE[idx]

    save_queue_to_disk(force=True)

    emit_socket("queue_updated", get_queue_state())
    return get_queue_state()


def queue_dispatcher_loop():
    """Background dispatcher ensuring queue concurrency and priority sorting."""
    while True:
        try:
            time.sleep(0.5)
            with QUEUE_LOCK:
                if QUEUE_SETTINGS.get("paused"):
                    continue

                concurrency = QUEUE_SETTINGS.get("concurrency", 1)
                active_count = sum(1 for item in QUEUE if item.get("status") in ("downloading", "merging"))

                if active_count >= concurrency:
                    continue

                slots_available = concurrency - active_count
                pending_items = [item for item in QUEUE if item.get("status") == "pending"]

                if not pending_items:
                    continue

                strategy = QUEUE_SETTINGS.get("strategy", "size")

                # Separate high priority tasks so they always jump ahead
                high_prio_items = [it for it in pending_items if it.get("priority") == "high"]
                regular_items = [it for it in pending_items if it.get("priority") != "high"]

                if strategy == "size":
                    # Shortest Job First
                    def size_key(it):
                        s = it.get("estimated_size")
                        if s and s > 0:
                            return s
                        dur = it.get("duration_sec") or 0
                        return dur * 300_000 if dur else 999_999_999
                    regular_items.sort(key=size_key)
                elif strategy == "manual":
                    prio_map = {"normal": 1, "low": 2}
                    regular_items.sort(key=lambda it: (prio_map.get(it.get("priority", "normal"), 1), it.get("order", 0)))
                # elif strategy == "fifo": preserves queue order

                ordered_pending = high_prio_items + regular_items
                items_to_launch = ordered_pending[:slots_available]
                for it in items_to_launch:
                    it["status"] = "downloading"
                    record_job_status(it["id"], "downloading")

            for it in items_to_launch:
                DOWNLOAD_EXECUTOR.submit(run_queue_download, it["id"])
        except Exception as e:
            print(f"Queue dispatcher error: {e}")


def orphan_temp_cleanup_worker():
    """
    Periodic background cleaner (runs every 10 minutes).
    Deletes orphaned *.part, *.ytdl, *.temp files older than 1 hour if no downloads are active.
    """
    while True:
        try:
            time.sleep(600)  # 10 minutes
            with QUEUE_LOCK:
                active_count = sum(1 for it in QUEUE if it.get("status") in ("downloading", "merging"))

            # Only perform sweep if there are no active downloads
            if active_count > 0:
                continue

            cfg = load_config()
            dirs_to_clean = {DEFAULT_DOWNLOAD_DIR}
            if cfg.get("default_dir"):
                dirs_to_clean.add(cfg.get("default_dir"))

            now = time.time()
            one_hour_ago = now - 3600

            for d in dirs_to_clean:
                if not os.path.isdir(d):
                    continue
                try:
                    for fname in os.listdir(d):
                        if fname.endswith((".part", ".ytdl", ".temp")) or ".part-" in fname:
                            fpath = os.path.join(d, fname)
                            if os.path.isfile(fpath):
                                mtime = os.path.getmtime(fpath)
                                if mtime < one_hour_ago:
                                    try:
                                        os.remove(fpath)
                                        print(f"Cleaned orphan temp file: {fname}")
                                    except Exception:
                                        pass
                except Exception as ex:
                    print(f"Error scanning for orphan temp files in {d}: {ex}")
        except Exception as e:
            print(f"Orphan temp cleanup worker note: {e}")


def start_background_workers(socketio=None):
    if socketio:
        set_socketio(socketio)
    threading.Thread(target=queue_dispatcher_loop, daemon=True).start()
    threading.Thread(target=orphan_temp_cleanup_worker, daemon=True).start()
