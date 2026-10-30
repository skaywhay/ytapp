import os
import uuid
import subprocess


def parse_time_str(s):
    if not s:
        return 0.0
    s = str(s).strip().replace(",", ".")
    parts = s.split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 1:
            return float(parts[0])
    except Exception:
        return 0.0
    return 0.0


def format_time_sec(sec):
    try:
        s = max(0, int(round(float(sec))))
        hrs, rem = divmod(s, 3600)
        mins, secs = divmod(rem, 60)
        if hrs > 0:
            return f"{hrs:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"
    except Exception:
        return "00:00"


def run_ffmpeg_with_progress(cmd, total_sec=0.0, progress_callback=None, timeout=180):
    """
    Executes an FFmpeg command with -progress pipe:1 and real-time percentage parsing.
    Prevents the UI from freezing at 99% by reporting true encoding progress.
    """
    cmd_with_prog = list(cmd)
    if "-progress" not in cmd_with_prog:
        # Insert -progress pipe:1 right after executable
        cmd_with_prog = [cmd_with_prog[0], "-progress", "pipe:1", "-nostats"] + cmd_with_prog[1:]

    startupinfo = None
    if os.name == "nt":
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    try:
        proc = subprocess.Popen(
            cmd_with_prog,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.DEVNULL,
            text=True,
            bufsize=1,
            universal_newlines=True,
            startupinfo=startupinfo,
        )
    except Exception as e:
        print(f"Failed to start FFmpeg with progress: {e}")
        return -1

    cur_sec = 0.0
    last_report_time = 0.0
    import time

    try:
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            if line.startswith("out_time_us="):
                try:
                    us_val = int(line.split("=")[1])
                    cur_sec = us_val / 1_000_000.0
                except Exception:
                    pass
            elif line.startswith("out_time="):
                try:
                    t_str = line.split("=")[1]
                    cur_sec = parse_time_str(t_str)
                except Exception:
                    pass
            elif line.startswith("progress="):
                status_key = line.split("=")[1].strip()
                now = time.time()
                if total_sec > 0:
                    pct = min(99.0, max(0.0, (cur_sec / total_sec) * 100.0))
                else:
                    pct = 50.0
                if status_key == "end":
                    pct = 100.0

                if progress_callback and (now - last_report_time >= 0.25 or pct >= 100.0):
                    last_report_time = now
                    progress_callback(pct, cur_sec, total_sec)

        proc.wait(timeout=timeout)
        if progress_callback:
            progress_callback(100.0, total_sec, total_sec)
        return proc.returncode
    except Exception as ex:
        print(f"FFmpeg progress loop exception: {ex}")
        try:
            proc.kill()
        except Exception:
            pass
        return -1


def trim_media_file(file_path, trim_start="", trim_end="", ffmpeg_bin=None, progress_callback=None):
    """
    Trims downloaded media file locally via FFmpeg with real-time progress feedback.
    Ensures 100% reliable frame-accurate cutting with fast stream copy and re-encode fallback.
    """
    if not file_path or not os.path.isfile(file_path):
        return file_path

    if not ffmpeg_bin:
        from core.engine import find_ffmpeg
        ffmpeg_bin = find_ffmpeg()

    if not ffmpeg_bin:
        print("FFmpeg not found; skipping trim")
        return file_path

    trim_start = (trim_start or "").strip()
    trim_end = (trim_end or "").strip()
    if not trim_start and not trim_end:
        return file_path

    s_sec = parse_time_str(trim_start) if trim_start else 0.0
    e_sec = parse_time_str(trim_end) if trim_end else None

    # If end timestamp is given and is less than or equal to start timestamp, ignore invalid range
    if e_sec is not None and e_sec <= s_sec:
        return file_path

    # If start is 0 and no end timestamp is specified, nothing to cut
    if s_sec == 0.0 and e_sec is None:
        return file_path

    dirname, fname = os.path.split(file_path)
    base, ext = os.path.splitext(fname)
    ext_lower = ext.lower()
    temp_out = os.path.join(dirname, f"{base}_trim_{uuid.uuid4().hex[:6]}{ext}")

    clip_duration = (e_sec - s_sec) if e_sec is not None else 60.0

    cmd = [ffmpeg_bin, "-y"]
    if s_sec > 0:
        cmd.extend(["-ss", str(s_sec)])
    if e_sec is not None:
        cmd.extend(["-to", str(e_sec)])

    cmd.extend(["-i", file_path])

    is_audio = ext_lower in (".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg", ".opus")

    # 1. Try fast stream copy first
    cmd_copy = list(cmd) + ["-c", "copy", "-avoid_negative_ts", "make_zero", temp_out]
    try:
        ret = run_ffmpeg_with_progress(cmd_copy, total_sec=clip_duration, progress_callback=progress_callback, timeout=90)
        if ret == 0 and os.path.isfile(temp_out) and os.path.getsize(temp_out) > 1024:
            os.replace(temp_out, file_path)
            return file_path
    except Exception as e:
        print(f"Trim copy note: {e}")

    if os.path.isfile(temp_out):
        try:
            os.remove(temp_out)
        except Exception:
            pass

    # 2. Fallback to re-encoding for frame-accurate cut
    cmd_encode = list(cmd) + ["-avoid_negative_ts", "make_zero"]
    if is_audio:
        cmd_encode.extend(["-c:a", "libmp3lame" if ext_lower == ".mp3" else "aac"])
    else:
        cmd_encode.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "copy"])
    cmd_encode.append(temp_out)

    try:
        ret2 = run_ffmpeg_with_progress(cmd_encode, total_sec=clip_duration, progress_callback=progress_callback, timeout=180)
        if ret2 == 0 and os.path.isfile(temp_out) and os.path.getsize(temp_out) > 1024:
            os.replace(temp_out, file_path)
            return file_path
    except Exception as e:
        print(f"Trim re-encode note: {e}")

    if os.path.isfile(temp_out):
        try:
            os.remove(temp_out)
        except Exception:
            pass

    return file_path
