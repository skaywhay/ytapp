# YT Deck

<p align="center">
  <strong>Современное настольное приложение для загрузки и обработки медиа с YouTube на базе yt-dlp, FFmpeg и Google Material Design 3.</strong>
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

## Обзор

**YT Deck** — быстрое и отзывчивое Windows-приложение для скачивания и конвертации видео и аудио с YouTube. Проект объединяет возможности **yt-dlp** и **FFmpeg** с интерфейсом, спроектированным по канонам дизайн-системы **Google Material Design 3 (M3 Expressive)** с поддержкой динамических палитр **Monet**.

Приложение работает в нативном контейнере Microsoft Edge WebView2 без консольных окон и стороннего оверхеда, поддерживает выбор мультиязычных дубляжей, форматы до 4K/8K IMAX, точную обрезку по таймкодам, параллельную очередь задач и обход сетевых ограничений через имитацию TLS-отпечатка Chrome.

---

## Возможности

### Material Design 3 и палитры Monet
- **M3 Navigation Rail / Tabs**: Быстрое переключение между основным экраном Deck, менеджером очереди и разделом настроек.
- **7 динамических акцентных палитр Monet**: YouTube Crimson, Sunset Amber, Ocean Azure, Emerald Forest, Electric Violet, Sunset Rose и Mint Teal.
- **Синхронизация тем**: Тёмная, Светлая и Системная темы с поддержкой тонального возвышения поверхностей и контрастности по стандарту WCAG AA.
- **Кастомные выпадающие списки**: Выпадающие селекторы с акриловым размытием фона и бейджами метаданных (разрешение, битрейт, размер).

### Медиадвижок и загрузка
- **Точное определение разрешений**: Корректное распознавание стандартных (1080p, 720p), широкоформатных и кинематографических соотношений IMAX (3840x2024 4K, 7680x4048 8K, кодеки AV1, VP9, H.264).
- **Мультиязычные аудиодорожки**: Автоматическое сканирование и выбор альтернативных дубляжей видео (включая мультиязычные каналы) с приоритетом оригинального или русского трека.
- **Три основных режима**:
  - **Видео + Звук**: Склейка в контейнеры `MP4`, `MKV`, `WEBM`.
  - **Только видео**: Прямое извлечение видеопотока без звука (B-roll, видеомонтаж).
  - **Только аудио**: Извлечение звука высокой чёткости (`MP3`, `M4A`, `OPUS`, `FLAC`, `WAV`).
- **Обрезка по таймкодам**: Локальная обрезка фрагментов видео без потерь качества через FFmpeg.
- **Поддержка плейлистов**: Пакетная загрузка списков ссылок с указанием диапазона и индивидуальных настроек.

### Сетевая оптимизация и обход троттлинга
- **Имитация TLS-отпечатка Chrome**: Использование `curl_cffi` для предотвращения обрывов SSL-хэндшейка, сброса соединений и занижения скорости провайдерами и CDN.
- **Интегрированный QuickJS**: Встроенный легковесный движок QuickJS (`bin/qjs.exe`) для фонового решения JS-вызовов YouTube плеера.
- **Двухканальный мониторинг**: Сокет-поток дополнен резервным фоновым поллингом, что исключает зависание статус-бара при задержках пакетов.

---

## Стек технологий

- **Бэкенд**: Python 3.10+, Flask, Flask-SocketIO, Simple-WebSocket
- **Ядро**: yt-dlp, FFmpeg, curl-cffi, QuickJS
- **Фронтенд**: Vanilla JavaScript (ES6+), Modern CSS3 Tokens, Material Design 3 Expressive
- **Среда выполнения**: PyWebView (Microsoft Edge WebView2)
- **Сборка**: PyInstaller

---

## Быстрый старт

### Вариант 1. Автономный исполняемый файл (Рекомендуется)

1. Скачайте `YT_Deck.exe` из раздела Releases.
2. Убедитесь, что `ffmpeg.exe` добавлен в системный `PATH` или помещён в одну папку с `YT_Deck.exe`.
3. Запустите `YT_Deck.exe`.

### Вариант 2. Автоматический скрипт запуска

Для запуска из исходного кода на Windows:

1. Клонируйте репозиторий:
   ```cmd
   git clone https://github.com/skaywhay/ytapp.git
   cd ytapp
   ```
2. Запустите скрипт:
   ```cmd
   run.bat
   ```
   Скрипт автоматически создаст виртуальное окружение (`.venv`), установит зависимости из `requirements.txt` и запустит приложение.

### Вариант 3. Ручной запуск из терминала

```powershell
# 1. Создание и активация виртуального окружения
python -m venv .venv
.venv\Scripts\activate

# 2. Установка зависимостей
pip install -r requirements.txt

# 3. Запуск десктопного приложения
python server.py

# Опционально: Запуск в режиме браузера
python server.py --browser
```

---

## Сборка переносимого .EXE

Для сборки автономного исполняемого файла Windows:

```cmd
build_exe.bat
```

Либо вручную через PyInstaller:

```powershell
python -m PyInstaller --clean -y yt_deck.spec
```

Готовый файл будет сохранён в корневой папке проекта как `YT_Deck.exe`.

---

## Системные требования

- **Операционная система**: Windows 10 / 11 (64-бит)
- **Среда рендеринга**: Microsoft Edge WebView2 (предустановлен в Windows)
- **Медиаутилиты**:
  - `ffmpeg.exe` и `ffprobe.exe` в системном `PATH` либо рядом с исполняемым файлом.
- **Python**: 3.10 или новее (при запуске из исходного кода).

---

## Архитектура проекта

```text
ytapp/
├── server.py               # Точка входа: запуск WebView2 / веб-сервера Flask
├── api/                    # Маршруты API (/api/probe, /api/download) и сокет-события
├── core/                   # Конфигурация, движок yt-dlp, многопоточная очередь
├── services/               # Вспомогательные сервисы (обрезка таймкодов, автоапдейтер)
├── picker.py               # Мост для нативного выбора папок Windows
├── icon.ico                # Иконка приложения
├── yt_deck.spec            # Спецификация сборки PyInstaller
├── build_exe.bat           # Скрипт сборки в один клик
├── run.bat                 # Скрипт автоустановки и быстрого запуска в dev-режиме
├── requirements.txt        # Список зависимостей Python
├── templates/
│   └── index.html          # Разметка в стиле Material Design 3
└── static/
    ├── css/
    │   └── style.css       # Дизайн-токены M3, палитры Monet, адаптивная верстка
    └── js/
        └── app.js          # Логика клиента, Socket.IO обработчики, движок тем Monet
```

---

## Лицензия и отказ от ответственности

Программное обеспечение распространяется свободно для личного и образовательного использования. Данный проект является графической оболочкой для утилит `yt-dlp` и `ffmpeg`. Все авторские права на скачиваемый медиаконтент принадлежат их законным правообладателям.
