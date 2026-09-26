/**
 * YT Deck — Клиентский сценарий инспекции и выгрузки медиа.
 */

// Инициализация Socket.IO
const socket = io();

// Вспомогательный селектор
const $ = (id) => document.getElementById(id);

// Элементы формы ввода URL
const urlInput = $('url-input');
const probeBtn = $('probe-btn');
const probeError = $('probe-error');

// Элементы прокси
const proxyToggleBtn = $('proxy-toggle-btn');
const proxyToggleText = $('proxy-toggle-text');
const proxyRow = $('proxy-row');
const proxyInput = $('proxy-input');

// Карточка сведений о видео
const trackCard = $('track-card');
const trackThumb = $('track-thumb');
const trackTitle = $('track-title');
const trackUploader = $('track-uploader');
const trackDuration = $('track-duration');

// Секция каналов
const channelsSection = $('channels');
const videoEnabled = $('video-enabled');
const audioEnabled = $('audio-enabled');
const videoBody = $('video-body');
const audioBody = $('audio-body');
const videoSelect = $('video-select');
const audioSelect = $('audio-select');
const containerChips = $('container-chips');
const audioFormatChips = $('audio-format-chips');

// Секция выгрузки и директории
const transferSection = $('transfer');
const modeText = $('mode-text');
const destInput = $('dest-input');
const selectFolderBtn = $('select-folder-btn');
const openFolderBtn = $('open-folder-btn');
const folderStatus = $('folder-status');
const downloadBtn = $('download-btn');
const progressBlock = $('progress-block');
const ledFill = $('led-fill');
const progressStatus = $('progress-status');
const progressStats = $('progress-stats');
const downloadError = $('download-error');
const doneBanner = $('done-banner');
const doneFilename = $('done-filename');
const openDoneFolderBtn = $('open-done-folder-btn');

// Текущее состояние
let currentUrl = '';
let selectedContainer = 'mp4';
let selectedAudioFormat = 'mp3';
let currentJobId = null;
let lastDownloadedFilename = '';

// ==========================================
// 1. Инициализация и сохранение настроек
// ==========================================

// Восстановление прокси из localStorage
try {
  const savedProxy = localStorage.getItem('ytdeck_proxy') || '';
  if (savedProxy) {
    proxyInput.value = savedProxy;
    proxyRow.hidden = false;
    proxyToggleBtn.setAttribute('aria-expanded', 'true');
    const chevron = proxyToggleBtn.querySelector('.chevron');
    if (chevron) chevron.textContent = '▴';
  }
} catch (e) {
  console.warn('LocalStorage unavailable:', e);
}

// Переключение аккордеона прокси
proxyToggleBtn.addEventListener('click', () => {
  const isHidden = !proxyRow.hidden;
  proxyRow.hidden = isHidden;
  proxyToggleBtn.setAttribute('aria-expanded', String(!isHidden));
  const chevron = proxyToggleBtn.querySelector('.chevron');
  if (chevron) {
    chevron.textContent = isHidden ? '▾' : '▴';
  }
});

proxyInput.addEventListener('change', () => {
  try {
    localStorage.setItem('ytdeck_proxy', proxyInput.value.trim());
  } catch (e) {}
});

// Восстановление сохранённой папки загрузок
try {
  const savedDir = localStorage.getItem('ytdeck_dest_dir');
  if (savedDir) {
    destInput.value = savedDir;
  }
} catch (e) {}

destInput.addEventListener('change', () => {
  try {
    localStorage.setItem('ytdeck_dest_dir', destInput.value.trim());
  } catch (e) {}
});

// ==========================================
// 2. Выбор и открытие папки сохранения
// ==========================================

// Выбор папки через серверный вызов нативного системного диалога (Windows / macOS / Linux)
selectFolderBtn.addEventListener('click', async () => {
  selectFolderBtn.disabled = true;
  const originalHtml = selectFolderBtn.innerHTML;
  selectFolderBtn.innerHTML = '<span>Открытие…</span>';
  if (folderStatus) {
    folderStatus.textContent = 'Окно выбора папки открыто на вашем компьютере…';
    folderStatus.hidden = false;
  }

  try {
    const res = await fetch('/api/select-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_folder: destInput.value.trim() }),
    });
    const data = await res.json();
    if (data.ok && data.folder) {
      destInput.value = data.folder;
      if (folderStatus) {
        folderStatus.textContent = '✓ Выбрана папка: ' + data.folder;
        folderStatus.hidden = false;
      }
      try {
        localStorage.setItem('ytdeck_dest_dir', data.folder);
      } catch (e) {}
    } else if (data.cancelled) {
      if (folderStatus) {
        folderStatus.hidden = true;
      }
    } else if (data.error) {
      if (folderStatus) {
        folderStatus.textContent = 'Ошибка: ' + data.error;
        folderStatus.hidden = false;
      }
    }
  } catch (err) {
    console.error('Ошибка выбора папки:', err);
    if (folderStatus) {
      folderStatus.textContent = 'Не удалось связаться с сервером для открытия диалога.';
      folderStatus.hidden = false;
    }
  } finally {
    selectFolderBtn.disabled = false;
    selectFolderBtn.innerHTML = originalHtml;
  }
});

// Открытие текущей папки в Explorer / Finder
async function openCurrentFolder() {
  const folder = destInput.value.trim();
  try {
    await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
  } catch (err) {
    console.error('Ошибка открытия папки:', err);
  }
}

openFolderBtn.addEventListener('click', openCurrentFolder);
if (openDoneFolderBtn) {
  openDoneFolderBtn.addEventListener('click', openCurrentFolder);
}

// ==========================================
// 3. Управление чипами форматов и кодеков
// ==========================================

function setupChipGroup(container, onSelect) {
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');
      onSelect(chip.dataset.value);
    });
  });
}

setupChipGroup(containerChips, (v) => {
  selectedContainer = v;
  updateMode();
});

setupChipGroup(audioFormatChips, (v) => {
  selectedAudioFormat = v;
  updateMode();
});

function updateMode() {
  const vOn = videoEnabled.checked;
  const aOn = audioEnabled.checked;

  videoBody.classList.toggle('disabled', !vOn);
  audioBody.classList.toggle('disabled', !aOn);

  let text = '';
  if (vOn && aOn) {
    text = `Видео + звук · склейка в ${selectedContainer.toUpperCase()}`;
  } else if (vOn && !aOn) {
    text = 'Только видеопоток (без звука)';
  } else if (!vOn && aOn) {
    text = `Только аудиодорожка · ${selectedAudioFormat.toUpperCase()}`;
  } else {
    text = 'Выберите хотя бы один канал';
  }

  modeText.textContent = text;
  downloadBtn.disabled = !(vOn || aOn);
}

videoEnabled.addEventListener('change', updateMode);
audioEnabled.addEventListener('change', updateMode);

// ==========================================
// 4. Считывание URL и анализ форматов
// ==========================================

probeBtn.addEventListener('click', probe);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') probe();
});

async function probe() {
  const url = urlInput.value.trim();
  probeError.hidden = true;
  probeError.textContent = '';

  if (!url) {
    probeError.textContent = 'Вставьте ссылку на видео YouTube.';
    probeError.hidden = false;
    return;
  }

  probeBtn.disabled = true;
  probeBtn.querySelector('.btn-label').textContent = 'Анализ…';
  probeBtn.querySelector('.spinner').hidden = false;

  try {
    const res = await fetch('/api/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        proxy: proxyInput.value.trim(),
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      probeError.textContent = data.error || 'Не удалось получить данные о видео.';
      probeError.hidden = false;
      trackCard.hidden = true;
      channelsSection.hidden = true;
      transferSection.hidden = true;
      return;
    }

    currentUrl = url;

    // Заполнение метаданных ролика
    trackThumb.src = data.thumbnail || '';
    trackTitle.textContent = data.title || 'Без названия';
    trackUploader.textContent = data.uploader || 'Неизвестный автор';
    trackDuration.textContent = data.duration || '';
    trackCard.hidden = false;

    // Заполнение выпадающих списков форматов
    fillSelect(
      videoSelect,
      data.video_formats,
      (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`
    );
    fillSelect(
      audioSelect,
      data.audio_formats,
      (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`
    );

    channelsSection.hidden = false;
    transferSection.hidden = false;
    progressBlock.hidden = true;
    doneBanner.hidden = true;
    downloadError.hidden = true;
    updateMode();
  } catch (e) {
    probeError.textContent = 'Ошибка соединения с сервером: ' + e.message;
    probeError.hidden = false;
  } finally {
    probeBtn.disabled = false;
    probeBtn.querySelector('.btn-label').textContent = 'Считать';
    probeBtn.querySelector('.spinner').hidden = true;
  }
}

function fillSelect(select, items, labelFn) {
  select.innerHTML = '';
  if (!items || !items.length) {
    const opt = document.createElement('option');
    opt.textContent = 'Нет доступных вариантов';
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.format_id;
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });
}

// ==========================================
// 5. Запуск загрузки и прогресс Socket.IO
// ==========================================

downloadBtn.addEventListener('click', startDownload);

async function startDownload() {
  const vOn = videoEnabled.checked;
  const aOn = audioEnabled.checked;
  if (!vOn && !aOn) return;

  let mode;
  if (vOn && aOn) mode = 'both';
  else if (vOn) mode = 'video';
  else mode = 'audio';

  const payload = {
    url: currentUrl,
    mode,
    video_format_id: videoSelect.value,
    audio_format_id: audioSelect.value,
    container: selectedContainer,
    audio_codec: selectedAudioFormat,
    out_dir: destInput.value.trim(),
    proxy: proxyInput.value.trim(),
  };

  downloadBtn.disabled = true;
  downloadError.hidden = true;
  doneBanner.hidden = true;
  progressBlock.hidden = false;
  ledFill.style.width = '0%';
  progressStatus.textContent = 'Подготовка потока…';
  progressStats.textContent = '';

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || 'Не удалось запустить загрузку');
    }
    currentJobId = data.job_id;
  } catch (e) {
    downloadError.textContent = e.message;
    downloadError.hidden = false;
    downloadBtn.disabled = false;
    progressBlock.hidden = true;
  }
}

// Подписка на сокет-событие прогресса загрузки
socket.on('progress', (data) => {
  if (!currentJobId || data.job_id !== currentJobId) return;

  if (data.status === 'downloading') {
    const pct = Math.min(100, Math.max(0, data.percent || 0));
    ledFill.style.width = `${pct}%`;
    progressStatus.textContent = `Скачиваем (${Math.round(pct)}%)`;
    progressStats.textContent = `${data.downloaded || '—'} / ${data.total || '—'} · ${data.speed || ''}`;
  } else if (data.status === 'merging') {
    ledFill.style.width = '99%';
    progressStatus.textContent = 'Склейка и постобработка через FFmpeg…';
    progressStats.textContent = '';
  } else if (data.status === 'done') {
    ledFill.style.width = '100%';
    progressStatus.textContent = 'Готово';
    progressStats.textContent = '';
    doneBanner.hidden = false;
    lastDownloadedFilename = data.filename || 'video.mp4';
    doneFilename.textContent = lastDownloadedFilename;
    if (data.folder) {
      destInput.value = data.folder;
    }
    downloadBtn.disabled = false;
  } else if (data.status === 'error') {
    downloadError.textContent = 'Ошибка загрузки: ' + data.error;
    downloadError.hidden = false;
    progressBlock.hidden = true;
    downloadBtn.disabled = false;
  }
});

updateMode();
