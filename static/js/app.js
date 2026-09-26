const socket = io();

const el = (id) => document.getElementById(id);

const urlInput = el('url-input');
const probeBtn = el('probe-btn');
const probeError = el('probe-error');
const proxyToggleBtn = el('proxy-toggle-btn');
const proxyRow = el('proxy-row');
const proxyInput = el('proxy-input');

// Restore saved proxy (if any) and remember whether the panel should stay open
const savedProxy = localStorage.getItem('ytdeck_proxy') || '';
if (savedProxy){
  proxyInput.value = savedProxy;
  proxyRow.hidden = false;
  proxyToggleBtn.textContent = 'Прокси (опционально) ▴';
}
proxyToggleBtn.addEventListener('click', () => {
  proxyRow.hidden = !proxyRow.hidden;
  proxyToggleBtn.textContent = proxyRow.hidden ? 'Прокси (опционально) ▾' : 'Прокси (опционально) ▴';
});
proxyInput.addEventListener('change', () => {
  localStorage.setItem('ytdeck_proxy', proxyInput.value.trim());
});

const trackCard = el('track-card');
const trackThumb = el('track-thumb');
const trackTitle = el('track-title');
const trackUploader = el('track-uploader');
const trackDuration = el('track-duration');

const channels = el('channels');
const videoEnabled = el('video-enabled');
const audioEnabled = el('audio-enabled');
const videoBody = el('video-body');
const audioBody = el('audio-body');
const videoSelect = el('video-select');
const audioSelect = el('audio-select');
const containerChips = el('container-chips');
const audioFormatChips = el('audio-format-chips');

const transfer = el('transfer');
const modeText = el('mode-text');
const destPath = el('dest-path');
const openFolderBtn = el('open-folder-btn');
const downloadBtn = el('download-btn');
const progressBlock = el('progress-block');
const ledFill = el('led-fill');
const progressStatus = el('progress-status');
const progressStats = el('progress-stats');
const downloadError = el('download-error');
const doneBanner = el('done-banner');
const doneFilename = el('done-filename');

let currentUrl = '';
let selectedContainer = 'mp4';
let selectedAudioFormat = 'mp3';
let currentJobId = null;

function setChipGroup(container, onSelect){
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      onSelect(chip.dataset.value);
    });
  });
}
setChipGroup(containerChips, v => { selectedContainer = v; updateMode(); });
setChipGroup(audioFormatChips, v => { selectedAudioFormat = v; updateMode(); });

function updateMode(){
  const vOn = videoEnabled.checked;
  const aOn = audioEnabled.checked;
  videoBody.classList.toggle('disabled', !vOn);
  audioBody.classList.toggle('disabled', !aOn);

  let text = '';
  if (vOn && aOn){
    text = `Видео + звук · склейка в ${selectedContainer.toUpperCase()}`;
  } else if (vOn && !aOn){
    text = 'Только видео (без звука)';
  } else if (!vOn && aOn){
    text = `Только звук · ${selectedAudioFormat.toUpperCase()}`;
  } else {
    text = 'Выберите хотя бы один канал';
  }
  modeText.textContent = text;
  downloadBtn.disabled = !(vOn || aOn);
}
videoEnabled.addEventListener('change', updateMode);
audioEnabled.addEventListener('change', updateMode);

probeBtn.addEventListener('click', probe);
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') probe(); });

async function probe(){
  const url = urlInput.value.trim();
  probeError.hidden = true;
  if (!url){
    probeError.textContent = 'Вставьте ссылку на видео.';
    probeError.hidden = false;
    return;
  }

  probeBtn.disabled = true;
  probeBtn.querySelector('.btn-label').textContent = 'Считываем…';
  probeBtn.querySelector('.spinner').hidden = false;

  try{
    const res = await fetch('/api/probe', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url, proxy: proxyInput.value.trim()})
    });
    const data = await res.json();
    if (!data.ok){
      probeError.textContent = data.error || 'Не удалось получить данные о видео.';
      probeError.hidden = false;
      trackCard.hidden = true;
      channels.hidden = true;
      transfer.hidden = true;
      return;
    }

    currentUrl = url;
    trackThumb.src = data.thumbnail || '';
    trackTitle.textContent = data.title || 'Без названия';
    trackUploader.textContent = data.uploader || '';
    trackDuration.textContent = data.duration || '';
    trackCard.hidden = false;

    fillSelect(videoSelect, data.video_formats, f => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`);
    fillSelect(audioSelect, data.audio_formats, f => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`);

    channels.hidden = false;
    transfer.hidden = false;
    progressBlock.hidden = true;
    doneBanner.hidden = true;
    downloadError.hidden = true;
    updateMode();
  } catch(e){
    probeError.textContent = 'Ошибка соединения с сервером: ' + e.message;
    probeError.hidden = false;
  } finally {
    probeBtn.disabled = false;
    probeBtn.querySelector('.btn-label').textContent = 'Считать';
    probeBtn.querySelector('.spinner').hidden = true;
  }
}

function fillSelect(select, items, labelFn){
  select.innerHTML = '';
  if (!items || !items.length){
    const opt = document.createElement('option');
    opt.textContent = 'Нет доступных вариантов';
    select.appendChild(opt);
    return;
  }
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.format_id;
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });
}

openFolderBtn.addEventListener('click', async () => {
  await fetch('/api/open-folder', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({folder: destPath.textContent})
  });
});

downloadBtn.addEventListener('click', startDownload);

async function startDownload(){
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
    out_dir: destPath.textContent,
    proxy: proxyInput.value.trim(),
  };

  downloadBtn.disabled = true;
  downloadError.hidden = true;
  doneBanner.hidden = true;
  progressBlock.hidden = false;
  ledFill.style.width = '0%';
  progressStatus.textContent = 'Готовим поток…';
  progressStats.textContent = '';

  try{
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok){
      throw new Error(data.error || 'Не удалось запустить загрузку');
    }
    currentJobId = data.job_id;
  } catch(e){
    downloadError.textContent = e.message;
    downloadError.hidden = false;
    downloadBtn.disabled = false;
    progressBlock.hidden = true;
  }
}

socket.on('progress', (data) => {
  if (!currentJobId || data.job_id !== currentJobId) return;

  if (data.status === 'downloading'){
    ledFill.style.width = `${data.percent}%`;
    progressStatus.textContent = 'Скачиваем…';
    progressStats.textContent = `${data.downloaded || '—'} / ${data.total || '—'} · ${data.speed || ''}`;
  } else if (data.status === 'merging'){
    ledFill.style.width = '99%';
    progressStatus.textContent = 'Склеиваем и конвертируем…';
    progressStats.textContent = '';
  } else if (data.status === 'done'){
    ledFill.style.width = '100%';
    progressStatus.textContent = 'Готово';
    progressStats.textContent = '';
    doneBanner.hidden = false;
    doneFilename.textContent = data.filename;
    destPath.textContent = data.folder;
    downloadBtn.disabled = false;
  } else if (data.status === 'error'){
    downloadError.textContent = 'Ошибка загрузки: ' + data.error;
    downloadError.hidden = false;
    progressBlock.hidden = true;
    downloadBtn.disabled = false;
  }
});

updateMode();
