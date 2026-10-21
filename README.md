# YT Deck

<p align="center">
  <strong>Modern desktop YouTube downloader powered by yt-dlp, FFmpeg, and Google Material Design 3.</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_RU.md">Русский</a>
</p>

<p align="center">
  <a href="https://m3.material.io"><img src="https://img.shields.io/badge/UI-Material%20Design%203-6750A4?style=flat-square" alt="Material Design 3"></a>
  <a href="https://m3.material.io/styles/color/the-color-system/tokens"><img src="https://img.shields.io/badge/Theming-Monet%20Palette%20Engine-006A60?style=flat-square" alt="Monet Palette"></a>
  <a href="https://developer.microsoft.com/en-us/microsoft-edge/webview2/"><img src="https://img.shields.io/badge/Platform-Windows%20WebView2-0078D7?style=flat-square" alt="Windows WebView2"></a>
  <a href="https://github.com/yt-dlp/yt-dlp"><img src="https://img.shields.io/badge/Core-yt--dlp%20%7C%20FFmpeg-FF0000?style=flat-square" alt="yt-dlp FFmpeg"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square" alt="Python"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT%20%2F%20Personal-blue?style=flat-square" alt="License"></a>
</p>

---

## Overview

**YT Deck** is a lightweight, responsive Windows desktop application for downloading and processing YouTube media streams. It combines the power of **yt-dlp** and **FFmpeg** with a desktop interface built around **Google Material Design 3 (M3 Expressive)** and the **Monet dynamic color engine**.

Unlike standard command-line wrappers or outdated GUI utilities, YT Deck delivers a smooth native desktop experience via Microsoft Edge WebView2, supporting multi-language audio dubs, up to 4K/8K IMAX resolutions, automatic timecode trimming, queue management, and modern network resilience with Chrome TLS fingerprint impersonation.

---

## Features

### Material Design 3 & Monet Engine
- **M3 Navigation Rail / Tabs**: Seamless switching between the primary Deck workspace, Queue Manager, and Settings view.
- **7 Dynamic Monet Accent Palettes**: YouTube Crimson, Sunset Amber, Ocean Azure, Emerald Forest, Electric Violet, Sunset Rose, and Mint Teal.
- **System Theme Synchronization**: Dynamic switching between Dark, Light, and System modes with WCAG AA compliant contrast ratios and tonal surface elevation.
- **Custom Blur Dropdowns**: Hardware-accelerated acrylic dropdown selectors with custom badge metadata indicators.

### Download & Media Engine
- **Accurate Stream Selection**: Real-time resolution detection supporting standard (1080p, 720p), ultrawide, and cinematic IMAX aspect ratios (3840x2024 4K, 7680x4048 8K, AV1, VP9, H.264).
- **Multi-Track Audio Dubs**: Automatic detection and extraction of alternate language dub tracks (e.g., multi-language creator tracks) with auto-preference settings.
- **Three Core Modes**:
  - **Video + Audio**: Merged container output (`MP4`, `MKV`, `WEBM`).
  - **Video Only**: Direct video stream extraction for editing and B-roll.
  - **Audio Only**: High-fidelity sound extraction (`MP3`, `M4A`, `OPUS`, `FLAC`, `WAV`).
- **Timecode Trimming**: Local lossless trimming with sub-second precision via FFmpeg post-processing.
- **Playlist Management**: Batch URL ingestion with range limits and individual format overrides.

### Network Performance & Anti-Throttling
- **Chrome TLS Impersonation**: Built-in `curl_cffi` client fingerprint matching to eliminate ISP connection drops, handshake timeouts, and CDN speed throttling.
- **QuickJS Challenge Solver**: Bundled QuickJS interpreter (`bin/qjs.exe`) for automated YouTube player challenge solving without stalls.
- **Dual-State Realtime Feedback**: WebSocket event stream supplemented by a background polling mechanism ensuring uninterrupted progress and bandwidth reporting.

---

## Tech Stack

- **Backend**: Python 3.10+, Flask, Flask-SocketIO, Simple-WebSocket
- **Engine**: yt-dlp, FFmpeg, curl-cffi, QuickJS
- **Frontend**: Vanilla JavaScript (ES6+), Modern CSS3 Tokens, Material Design 3 Expressive
- **Desktop Runtime**: PyWebView (Microsoft Edge WebView2)
- **Packaging**: PyInstaller

---

## Quick Start

### Option 1: Standalone Portable Executable (Recommended)

1. Download the latest `YT_Deck.exe` from the Releases section.
2. Ensure `ffmpeg.exe` is available in your system `PATH` or placed in the same folder as `YT_Deck.exe`.
3. Launch `YT_Deck.exe`.

### Option 2: Automatic Setup Script

For development or running directly from source on Windows:

1. Clone the repository:
   ```cmd
   git clone https://github.com/skaywhay/ytapp.git
   cd ytapp
   ```
2. Run the startup script:
   ```cmd
   run.bat
   ```
   The script automatically initializes a virtual environment (`.venv`), installs required dependencies from `requirements.txt`, and boots the application.

### Option 3: Manual Installation

```powershell
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start desktop application
python server.py

# Optional: Run as browser web-service
python server.py --browser
```

---

## Building Executable

To compile a standalone, single-file Windows executable:

```cmd
build_exe.bat
```

Or invoke PyInstaller manually:

```powershell
python -m PyInstaller --clean -y yt_deck.spec
```

The compiled binary will be placed at the project root as `YT_Deck.exe`.

---

## System Requirements

- **Operating System**: Windows 10 / 11 (64-bit)
- **Runtime**: Microsoft Edge WebView2 (pre-installed on modern Windows)
- **Media Tools**:
  - `ffmpeg.exe` and `ffprobe.exe` installed in system `PATH` or placed inside the application directory.
- **Python**: 3.10 or newer (for source execution).

---

## Project Structure

```text
ytapp/
├── server.py               # Application entry point: WebView2 / Flask server
├── api/                    # REST endpoints (/api/probe, /api/download) & Socket.IO handlers
├── core/                   # Engine abstraction, configuration, queue dispatcher
├── services/               # Background services (media trimming, updater)
├── picker.py               # Native Windows directory selection bridge
├── icon.ico                # Application icon
├── yt_deck.spec            # PyInstaller build specification
├── build_exe.bat           # Automated single-click build script
├── run.bat                 # Development auto-setup and launch script
├── requirements.txt        # Python dependency manifest
├── templates/
│   └── index.html          # Semantic Material Design 3 user interface
└── static/
    ├── css/
    │   └── style.css       # M3 design tokens, Monet color schemes, responsive layout
    └── js/
        └── app.js          # Client controller, Socket.IO listeners, Monet engine
```

---

## License & Disclaimer

Distributed freely for personal and educational use. This software is an interface utility for `yt-dlp` and `ffmpeg`. All copyrights and intellectual property regarding downloaded content belong to their respective creators and copyright owners.
