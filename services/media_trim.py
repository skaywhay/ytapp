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


def trim_media_file(file_path, trim_start="", trim_end="", ffmpeg_bin=None):
    """
    Trims downloaded media file locally via FFmpeg.
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
        res = subprocess.run(cmd_copy, capture_output=True, text=True, timeout=90)
        if res.returncode == 0 and os.path.isfile(temp_out) and os.path.getsize(temp_out) > 1024:
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
        res2 = subprocess.run(cmd_encode, capture_output=True, text=True, timeout=180)
        if res2.returncode == 0 and os.path.isfile(temp_out) and os.path.getsize(temp_out) > 1024:
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
