#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Detect Python interpreter
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "[Error] Python 3 is required but not installed or not in PATH."
  exit 1
fi

# Virtual Environment initialization
if [ ! -d ".venv" ]; then
  echo "[*] Creating virtual environment (.venv)..."
  "$PYTHON_BIN" -m venv .venv
  source .venv/bin/activate
  echo "[*] Installing dependencies..."
  pip install --upgrade pip
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

# Check for ffmpeg
if ! command -v ffmpeg >/dev/null 2>&1 && [ ! -f "bin/ffmpeg" ]; then
  echo "[Notice] FFmpeg not found in PATH or bin/. Media merging might be limited."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Tip for macOS: brew install ffmpeg"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Tip for Linux: sudo apt install ffmpeg (or pacman -S ffmpeg)"
  fi
fi

# Launch application
exec python server.py "$@"
