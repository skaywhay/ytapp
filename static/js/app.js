/**
 * YT Deck — Client Controller (Material Design 3 Expressive)
 * Version: 2.4 (Multi-Stream Batch Queue, Prioritized Bandwidth Management, Material 3 Expressive)
 */

// Initialize Socket.IO connection
const socket = io();

// Helper selector
const $ = (id) => document.getElementById(id);

// Navigation Elements
const tabDeckBtn = $('tab-deck-btn');
const tabQueueBtn = $('tab-queue-btn');
const tabSettingsBtn = $('tab-settings-btn');
const viewDeck = $('view-deck');
const viewQueue = $('view-queue');
const viewSettings = $('view-settings');
const queueCountBadge = $('queue-count-badge');

// Topbar FFmpeg Pill
const topbarFfmpegPill = $('topbar-ffmpeg-pill');
const topbarFfmpegText = $('topbar-ffmpeg-text');

// Form Elements
const urlInput = $('url-input');
const urlFieldWrap = $('url-field-wrap');
const urlSupportingError = $('url-supporting-error');
const urlSupportingMsg = $('url-supporting-msg');
const probeBtn = $('probe-btn');
const clearUrlBtn = $('clear-url-btn');
const pasteUrlBtn = $('paste-url-btn');

// Floating Snackbar Toast
const snackbar = $('m3-snackbar');
const snackbarText = $('m3-snackbar-text');
const snackbarIcon = $('m3-snackbar-icon');
const snackbarClose = $('m3-snackbar-close');
let snackbarTimer = null;

// Theme Elements
const themeToggleBtn = $('theme-toggle-btn');
const themeIconDark = $('theme-icon-dark');
const themeIconLight = $('theme-icon-light');
const themeModeSegmented = $('theme-mode-segmented');

// Language Elements
const langToggleBtn = $('lang-toggle-btn');
const topbarLangText = $('topbar-lang-text');
const languageModeSegmented = $('language-mode-segmented');

// App Update Elements
const checkAppUpdateBtn = $('check-app-update-btn');
const appUpdateStatus = $('app-update-status');
const engineAppVerBadge = $('engine-app-ver-badge');

// Settings Elements
const monetSwatchesGrid = $('monet-swatches-grid');
const activeMonetName = $('active-monet-name');
const settingsDefaultDirInput = $('settings-default-dir-input');
const settingsSelectFolderBtn = $('settings-select-folder-btn');
const settingsOpenFolderBtn = $('settings-open-folder-btn');
const resetDefaultDirBtn = $('reset-default-dir-btn');
const settingsCookiesSelect = $('settings-cookies-select');
const checkYtdlpUpdateBtn = $('check-ytdlp-update-btn');
const ytdlpUpdateStatus = $('ytdlp-update-status');
const engineYtdlpVerBadge = $('engine-ytdlp-ver-badge');
const downloadFfmpegBtn = $('download-ffmpeg-btn');
const ffmpegDownloadStatus = $('ffmpeg-download-status');
const engineFfmpegBadge = $('engine-ffmpeg-badge');

// Proxy Elements
const proxyToggleBtn = $('proxy-toggle-btn');
const proxyToggleText = $('proxy-toggle-text');
const proxyRow = $('proxy-row');
const proxyInput = $('proxy-input');

// Video Metadata Card
const trackCard = $('track-card');
const trackThumb = $('track-thumb');
const trackTitle = $('track-title');
const trackUploader = $('track-uploader');
const trackDuration = $('track-duration');
const trackViews = $('track-views');
const trackDate = $('track-date');
const downloadThumbBtn = $('download-thumb-btn');

// Target Mode & Channels Section
const modeSlot = $('mode-slot');
const modeSegmented = $('mode-segmented');
const channelsSection = $('channels');
const simpleQualityCard = $('simple-quality-card');
const simplePresetSelect = $('simple-preset-select');
const toggleExpertModeBtn = $('toggle-expert-mode-btn');
const expertChannelsWrap = $('expert-channels-wrap');
const expertModeToggleText = $('expert-mode-toggle-text');
const settingsExpertModeSwitch = $('settings-expert-mode-switch');
const settingsPrefCodec = $('settings-pref-codec');
const settingsPrefContainer = $('settings-pref-container');
const settingsPrefAudioFormat = $('settings-pref-audio-format');
const GEAR_SPIN_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-icon"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const presetBestDesc = $('preset-best-desc');
const presetAudioDesc = $('preset-audio-desc');
const videoCardStrip = $('video-card-strip');
const audioCardStrip = $('audio-card-strip');
const videoSelect = $('video-select');
const audioSelect = $('audio-select');
const audioTrackWrap = $('audio-track-wrap');
const audioTrackSelect = $('audio-track-select');
const audioTrackBadge = $('audio-track-badge');
const containerChips = $('container-chips');
const audioFormatChips = $('audio-format-chips');

// Playlist Selection Modal Elements
const playlistModal = $('playlist-modal');
const playlistModalCancelBtn = $('playlist-modal-cancel-btn');
const playlistModalConfirmBtn = $('playlist-modal-confirm-btn');
const playlistPreviewThumb = $('playlist-preview-thumb');
const playlistPreviewTitle = $('playlist-preview-title');
const playlistPreviewUploader = $('playlist-preview-uploader');
const playlistPreviewCount = $('playlist-preview-count');
const plRangeAll = $('pl-range-all');
const plRangeCustom = $('pl-range-custom');
const plRangeInputs = $('pl-range-inputs');
const plRangeStart = $('pl-range-start');
const plRangeEnd = $('pl-range-end');
const plPresetChips = $('playlist-preset-chips');
const plConfirmLabel = $('playlist-confirm-label');

// Extra Options Section (Subtitles & Trim)
const extraOptionsSlot = $('extra-options-slot');
const subtitlesEnabled = $('subtitles-enabled');
const subtitlesBody = $('subtitles-body');
const subtitlesSelect = $('subtitles-select');
const subtitlesEmbed = $('subtitles-embed');
const trimEnabled = $('trim-enabled');
const trimBody = $('trim-body');
const trimStartInput = $('trim-start-input');
const trimEndInput = $('trim-end-input');
const trimRangeStart = $('trim-range-start');
const trimRangeEnd = $('trim-range-end');
const trimSliderHighlight = $('trim-slider-highlight');
const trimLblStart = $('trim-lbl-start');
const trimLblEnd = $('trim-lbl-end');
const trimLblClipInfo = $('trim-lbl-clip-info');
const trimDurationBadge = $('trim-duration-badge');

// Transfer / Save Section (Deck)
const transferSection = $('transfer');
const modeText = $('mode-text');
const destInput = $('dest-input');
const selectFolderBtn = $('select-folder-btn');
const openFolderBtn = $('open-folder-btn');
const folderStatus = $('folder-status');
const downloadBtn = $('download-btn');
const splitMenuToggleBtn = $('split-menu-toggle-btn');
const splitDropdownMenu = $('split-dropdown-menu');
const deckAddQueueBtn = $('deck-add-queue-btn');
const progressBlock = $('progress-block');
const ledFill = $('led-fill');
const progressStatus = $('progress-status');
const progressStats = $('progress-stats');
const cancelDownloadBtn = $('cancel-download-btn');
const doneBanner = $('done-banner');
const doneFilename = $('done-filename');
const openDoneFolderBtn = $('open-done-folder-btn');
const playDoneFileBtn = $('play-done-file-btn');
const downloadAnotherBtn = $('download-another-btn');

// New Modern Redesign Elements
const dragDropOverlay = $('drag-drop-overlay');
const clipboardDetectChip = $('clipboard-detect-chip');
const chipPasteBtn = $('chip-paste-btn');
const chipDismissBtn = $('chip-dismiss-btn');
const emptyStateSection = $('empty-state-section');
const skeletonCard = $('skeleton-card');
const actionableErrorBanner = $('actionable-error-banner');
const errorBannerTitle = $('error-banner-title');
const errorBannerDesc = $('error-banner-desc');
const errorBannerCloseBtn = $('error-banner-close-btn');
const errActionCookies = $('err-action-cookies');
const errActionProxy = $('err-action-proxy');
const errActionFolder = $('err-action-folder');
const qualityCardsGrid = $('quality-cards-grid');

let lastDownloadedFilePath = '';

// Queue View Elements
const queueModeSegmented = $('queue-mode-segmented');
const queueStrategySelect = $('queue-strategy-select');
const queueSpeedSelect = $('queue-speed-select');
const queueResumeAllBtn = $('queue-resume-all-btn');
const queuePauseAllBtn = $('queue-pause-all-btn');
const queueToggleBatchBtn = $('queue-toggle-batch-btn');
const queueClearDoneBtn = $('queue-clear-done-btn');
const batchAddDrawer = $('batch-add-drawer');
const closeBatchDrawerBtn = $('close-batch-drawer-btn');
const batchUrlsInput = $('batch-urls-input');
const batchPresetChips = $('batch-preset-chips');
const batchSubmitBtn = $('batch-submit-btn');
const queueItemsContainer = $('queue-items-container');
const qStatTotal = $('q-stat-total');
const qStatActive = $('q-stat-active');
const qStatPending = $('q-stat-pending');
const qStatDone = $('q-stat-done');

// State Variables
let currentUrl = '';
let currentTitle = '';
let currentUploader = '';
let currentThumbnailUrl = '';
let currentDuration = '';
let currentDurationSec = 0;
let currentEstimatedSize = 0;
let currentMode = 'both'; // 'both' | 'audio' | 'video'
let selectedContainer = 'mp4';
let selectedAudioFormat = 'mp3';
let selectedBatchPreset = 'best';
let selectedSimplePreset = 'best';
let selectedPlaylistPreset = 'best';
let currentPlaylistData = null;
let urlDebounceTimer = null;
let lastProbedUrl = '';
let currentJobId = null;
let lastDownloadedFilename = '';
let availableAudioTracks = [];
let availableSubtitles = [];
let lastProbedVideoFormats = [];
let lastProbedAudioFormats = [];

const initialSettings = window.__INITIAL_SETTINGS__ || {};

// ==========================================
// 1. FLOATING SNACKBAR / TOAST SYSTEM
// ==========================================

function showToast(message, type = 'error', duration = 4500) {
  if (!snackbar) return;
  if (snackbarTimer) {
    clearTimeout(snackbarTimer);
    snackbarTimer = null;
  }

  snackbar.classList.remove('m3-snackbar--error', 'm3-snackbar--success');
  snackbar.classList.add(`m3-snackbar--${type}`);

  if (snackbarIcon) {
    if (type === 'success') {
      snackbarIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;
    } else {
      snackbarIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
    }
  }

  snackbarText.textContent = message;
  snackbar.hidden = false;

  void snackbar.offsetWidth;
  snackbar.classList.add('visible');

  snackbarTimer = setTimeout(hideToast, duration);
}

function hideToast() {
  if (!snackbar) return;
  snackbar.classList.remove('visible');
  setTimeout(() => {
    if (!snackbar.classList.contains('visible')) {
      snackbar.hidden = true;
    }
  }, 250);
}

if (snackbarClose) {
  snackbarClose.addEventListener('click', hideToast);
}

// ==========================================
// 2. FIELD ERROR MANAGEMENT
// ==========================================

function setFieldError(message) {
  if (urlFieldWrap) urlFieldWrap.classList.add('m3-text-field--error');
  if (urlSupportingMsg) urlSupportingMsg.textContent = message;
  if (urlSupportingError) urlSupportingError.hidden = false;
}

function clearFieldError() {
  if (urlFieldWrap) urlFieldWrap.classList.remove('m3-text-field--error');
  if (urlSupportingError) urlSupportingError.hidden = true;
  if (urlSupportingMsg) urlSupportingMsg.textContent = '';
}

// ==========================================
// 3. MATERIAL RIPPLE INTERACTION ENGINE
// ==========================================

function createRipple(event) {
  const target = event.currentTarget;
  if (target.disabled) return;

  const rect = target.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('md-ripple-element');

  const existingRipple = target.querySelector('.md-ripple-element');
  if (existingRipple) existingRipple.remove();

  target.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 600);
}

document.querySelectorAll('.md-ripple').forEach((el) => {
  el.addEventListener('pointerdown', createRipple);
});

const rippleObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (node.classList.contains('md-ripple')) {
          node.addEventListener('pointerdown', createRipple);
        }
        node.querySelectorAll?.('.md-ripple').forEach((el) => {
          el.addEventListener('pointerdown', createRipple);
        });
      }
    });
  });
});
rippleObserver.observe(document.body, { childList: true, subtree: true });

// ==========================================
// 4. M3 TOPBAR NAVIGATION (DECK VS QUEUE VS SETTINGS)
// ==========================================

function switchTab(tabName) {
  const isDeck = tabName === 'deck';
  const isQueue = tabName === 'queue';
  const isSettings = tabName === 'settings';

  if (tabDeckBtn) {
    tabDeckBtn.classList.toggle('active', isDeck);
    tabDeckBtn.setAttribute('aria-selected', String(isDeck));
  }
  if (tabQueueBtn) {
    tabQueueBtn.classList.toggle('active', isQueue);
    tabQueueBtn.setAttribute('aria-selected', String(isQueue));
  }
  if (tabSettingsBtn) {
    tabSettingsBtn.classList.toggle('active', isSettings);
    tabSettingsBtn.setAttribute('aria-selected', String(isSettings));
  }

  if (viewDeck) viewDeck.hidden = !isDeck;
  if (viewQueue) viewQueue.hidden = !isQueue;
  if (viewSettings) viewSettings.hidden = !isSettings;

  if (isQueue) {
    fetchQueue();
  }
}

if (tabDeckBtn) tabDeckBtn.addEventListener('click', () => switchTab('deck'));
if (tabQueueBtn) tabQueueBtn.addEventListener('click', () => switchTab('queue'));
if (tabSettingsBtn) tabSettingsBtn.addEventListener('click', () => switchTab('settings'));

// ==========================================
// 5. MONET DYNAMIC PALETTE ENGINE
// ==========================================

const MONET_PALETTES = {
  indigo: {
    name: 'Tech Indigo',
    colorHex: '#3B82F6',
    dark: { p: '#60A5FA', onP: '#0B132B', pC: '#1D4ED8', onPC: '#DBEAFE', sT: '#60A5FA' },
    light: { p: '#2563EB', onP: '#FFFFFF', pC: '#DBEAFE', onPC: '#1E3A8A', sT: '#2563EB' }
  },
  crimson: {
    name: 'YouTube Crimson',
    colorHex: '#BA1A1A',
    dark: { p: '#FFB4AB', onP: '#690005', pC: '#93000A', onPC: '#FFDAD6', sT: '#FFB4AB' },
    light: { p: '#BA1A1A', onP: '#FFFFFF', pC: '#FFDAD6', onPC: '#410002', sT: '#BA1A1A' }
  },
  amber: {
    name: 'Warm Amber',
    colorHex: '#FFBA38',
    dark: { p: '#FFBA38', onP: '#442C00', pC: '#624000', onPC: '#FFDF9E', sT: '#FFBA38' },
    light: { p: '#805600', onP: '#FFFFFF', pC: '#FFDF9E', onPC: '#2B1A00', sT: '#805600' }
  },
  blue: {
    name: 'Ocean Blue',
    colorHex: '#2E5AAC',
    dark: { p: '#B2C5FF', onP: '#002B73', pC: '#1B449A', onPC: '#DAE2FF', sT: '#B2C5FF' },
    light: { p: '#2E5AAC', onP: '#FFFFFF', pC: '#DAE2FF', onPC: '#001847', sT: '#2E5AAC' }
  },
  emerald: {
    name: 'Emerald Forest',
    colorHex: '#1B6D24',
    dark: { p: '#7CDA7B', onP: '#003A08', pC: '#005312', onPC: '#98F895', sT: '#7CDA7B' },
    light: { p: '#1B6D24', onP: '#FFFFFF', pC: '#98F895', onPC: '#002203', sT: '#1B6D24' }
  },
  violet: {
    name: 'Cyber Violet',
    colorHex: '#6750A4',
    dark: { p: '#CFBCFF', onP: '#381E72', pC: '#4F378B', onPC: '#EADDFF', sT: '#CFBCFF' },
    light: { p: '#6750A4', onP: '#FFFFFF', pC: '#EADDFF', onPC: '#21005D', sT: '#6750A4' }
  },
  rose: {
    name: 'Soft Rose',
    colorHex: '#984061',
    dark: { p: '#FFB1C8', onP: '#5E1133', pC: '#7B2949', onPC: '#FFD9E2', sT: '#FFB1C8' },
    light: { p: '#984061', onP: '#FFFFFF', pC: '#FFD9E2', onPC: '#3E001D', sT: '#984061' }
  },
  teal: {
    name: 'Electric Teal',
    colorHex: '#006A62',
    dark: { p: '#80D5CB', onP: '#003732', pC: '#005049', onPC: '#9CF1E7', sT: '#80D5CB' },
    light: { p: '#006A62', onP: '#FFFFFF', pC: '#9CF1E7', onPC: '#00201D', sT: '#006A62' }
  }
};

// ==========================================
// 4.1 INTERNATIONALIZATION (i18n) ENGINE
// ==========================================

const I18N = {
  ru: {
    brand_subtitle: 'Быстрая загрузка видео и аудио',
    tab_deck: 'Загрузка',
    tab_queue: 'Очередь',
    tab_settings: 'Настройки',
    ffmpeg_ok: 'FFmpeg активен',
    ffmpeg_missing: 'FFmpeg не найден',
    ffmpeg_ok_title: 'FFmpeg подключён и готов к склейке',
    ffmpeg_missing_title: 'Нажмите для автоматической установки FFmpeg',
    theme_toggle_title: 'Сменить тему (Светлая / Тёмная)',
    lang_toggle_title: 'Сменить язык (RU / EN)',

    slot1_title: 'Ссылка на видео',
    slot1_caption: 'Вставьте адрес ролика, Shorts или плейлиста YouTube',
    slot1_label: 'Ссылка на видео YouTube',
    btn_clear_url: 'Очистить поле',
    btn_paste_url: 'Вставить из буфера обмена',
    btn_probe: 'Найти видео',
    btn_probe_loading: 'Ищем…',
    btn_probe_found: 'Найдено!',
    btn_probe_error: 'Ошибка',
    clipboard_detected: 'В буфере найдена ссылка на YouTube. Вставить?',
    btn_paste: 'Вставить',
    proxy_toggle: 'Сетевой прокси / SOCKS (обход блокировок)',
    proxy_label: 'Адрес прокси (socks5://127.0.0.1:1080 или http://...)',
    proxy_hint: 'Если доступ к YouTube ограничен провайдером или VPN не маршрутизирует CLI-трафик — введите локальный адрес прокси.',
    quick_examples_title: 'Быстрые примеры:',
    quick_4k: 'Клип в 4K Ultra HD',
    quick_shorts: 'YouTube Shorts',
    quick_audio: 'Аудиоподкаст (MP3)',
    empty_ready: 'Готов к загрузке',
    empty_desc: 'Вставьте ссылку на ролик или Shorts в поле выше, либо перетащите файл прямо в это окно',

    btn_save_thumb: 'Скачать обложку',
    stat_views: 'просмотров',

    slot2_title: 'Режим скачивания',
    slot2_caption: 'Выберите формат выгрузки медиаконтента',
    mode_both: 'Видео + Звук (MP4)',
    mode_audio: 'Только аудио (MP3 / FLAC)',
    mode_video: 'Видео без звука',

    slot3_title: 'Качество загрузки',
    slot3_caption: 'Выберите желаемое разрешение видеоряда',
    slot3_title_audio: 'Качество звука',
    slot3_caption_audio: 'Выберите желаемый аудиоформат и битрейт',
    slot3_title_vonly: 'Качество видео (B-Roll)',
    slot3_caption_vonly: 'Только видеоряд без аудиодорожки',
    quality_video_label: 'Разрешение видео',
    quality_audio_label: 'Формат аудио',
    preset_best_audio: 'MP3 · 320 kbps (наивысший битрейт)',
    preset_m4a: 'M4A / AAC · 256 kbps (оригинальный чистый звук)',
    preset_opus: 'Opus · высокое качество (веб-оптимизация)',
    preset_flac: 'FLAC · Lossless (студийный звук без потерь)',
    preset_wav: 'WAV · Без сжатия (несжатое аудио)',
    preset_best_video: 'Максимальное качество',
    expert_toggle_show: 'Экспертный выбор дорожек',
    expert_toggle_hide: 'Скрыть экспертный выбор',
    expert_video_title: 'Параметры видеопотока',
    expert_video_sub: 'Разрешение, частота кадров и кодек',
    expert_video_label: 'Качество видеопотока',
    expert_audio_title: 'Параметры аудиопотока',
    expert_audio_sub: 'Битрейт, кодек и альтернативный дубляж',
    expert_audio_label: 'Качество аудиопотока',
    expert_track_label: 'Выбор языка дубляжа',

    slot4_title: 'Дополнительные опции',
    slot4_caption: 'Субтитры и обрезка по таймкодам',
    subtitles_title: 'Субтитры',
    subtitles_lang_label: 'Язык субтитров',
    subtitles_embed_label: 'Вшить субтитры в контейнер',
    subtitles_none: 'Субтитры не найдены',
    trim_title: 'Обрезка фрагмента',
    trim_duration_prefix: 'Хронометраж клипа: ',
    trim_start_label: 'Начало (От)',
    trim_end_label: 'Конец (До)',
    trim_hint: 'Передвигайте интерактивные ползунки или введите точные значения ЧЧ:ММ:СС. Скачивается только выбранный интервал.',

    slot5_title: 'Директория и запуск',
    slot5_caption: 'Подтвердите путь сохранения и запустите загрузку',
    folder_label: 'Папка сохранения',
    btn_browse: 'Выбрать',
    btn_open_folder: 'Открыть',
    mode_chip_prefix: 'Режим:',
    btn_start_download: 'Скачать видео',
    btn_add_to_queue: 'Добавить в очередь',
    btn_add_to_queue_desc: 'Ставит в конец очереди (фоновая загрузка)',

    btn_cancel_download: 'Отменить загрузку',
    merging_stage: 'Сведение через FFmpeg…',
    download_finished_toast: 'Загрузка успешно завершена!',

    queue_title: 'Диспетчер очереди',
    queue_caption: 'Управление многопоточной выгрузкой и балансировкой скорости',
    stat_total: 'Всего: ',
    stat_active: 'Активно: ',
    stat_pending: 'В очереди: ',
    stat_done: 'Готово: ',
    concurrency_label: 'Режим загрузки потоков',
    mode_sequential: 'По очереди (1 поток)',
    mode_parallel: 'Все вместе (3 потока)',
    strategy_label: 'Приоритет распределения скорости',
    strategy_size: 'Сначала небольшие файлы',
    strategy_fifo: 'По порядку добавления',
    strategy_manual: 'По приоритету задач (Высокий / Обычный)',
    speed_limit_label: 'Лимит суммарной скорости',
    speed_unlimited: 'Максимальная (Без ограничений)',
    btn_queue_start_all: 'Запустить все',
    btn_queue_pause_all: 'Пауза',
    btn_queue_batch: 'Пакетный ввод ссылок',
    btn_queue_clear_done: 'Очистить завершённые',
    queue_empty_title: 'Очередь выгрузки пуста',
    queue_empty_desc: 'Добавьте несколько ссылок через «Пакетный ввод» или перейдите на вкладку «Загрузка» и нажмите «В очередь» для любого настроенного ролика.',
    batch_drawer_title: 'Пакетное добавление ссылок',
    batch_drawer_label: 'Список URL (по одной ссылке на строку)',
    batch_drawer_placeholder: 'https://www.youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://www.youtube.com/shorts/...',
    btn_batch_submit: 'Добавить в очередь',
    btn_batch_close: 'Отмена',
    status_pending: 'В очереди',
    status_downloading: 'Скачивается',
    status_merging: 'Склейка FFmpeg',
    status_done: 'Завершено',
    status_paused: 'На паузе',
    status_cancelled: 'Отменено',
    status_error: 'Ошибка',
    btn_item_folder: 'Папка',
    btn_item_pause: 'Пауза',
    btn_item_resume: 'Продолжить',
    btn_item_cancel: 'Отмена',
    btn_item_delete: 'Удалить',
    prio_high: 'Высокий',
    prio_normal: 'Обычный',
    prio_low: 'Низкий',

    settings_lang_title: 'Язык интерфейса',
    settings_lang_subtitle: 'Выберите язык отображения приложения',
    settings_lang_label: 'Язык приложения',
    settings_theme_title: 'Тема и динамические цвета Monet',
    settings_theme_subtitle: 'Персонализация внешнего вида приложения в стиле Material You',
    settings_theme_mode_label: 'Режим отображения',
    theme_dark: 'Тёмная',
    theme_light: 'Светлая',
    theme_auto: 'Системная',
    settings_monet_palette_label: 'Акцентная палитра (Monet)',
    settings_cookies_title: 'Импорт авторизации (Cookies)',
    settings_cookies_subtitle: 'Обход капчи, защиты от ботов YouTube и доступ к видео 18+',
    settings_cookies_label: 'Браузер для считывания сессии',
    settings_cookies_hint: 'Позволяет скачивать видео с возрастным ограничением 18+, приватные ролики, доступные по ссылке видео и надежно обходить капчи/блокировки YouTube.',
    cookies_none: 'Без авторизации (по умолчанию)',
    settings_folder_title: 'Папка загрузок по умолчанию',
    settings_folder_subtitle: 'Директория, которая автоматически подставляется при каждом запуске',
    settings_folder_input_label: 'Папка по умолчанию',
    btn_reset_folder: 'Сбросить к ~/Downloads/YT-Deck',
    settings_adv_title: 'Продвинутые настройки',
    settings_adv_subtitle: 'Экспертный режим, параметры кодеков и контейнеров по умолчанию',
    settings_expert_label: 'Экспертный режим',
    settings_expert_hint: 'Отображать подробный выбор отдельных видео-, аудиодорожек и субтитров на главной вкладке загрузки',
    settings_codec_label: 'Предпочитаемый видеокодек',
    settings_container_label: 'Формат контейнера по умолчанию',
    settings_audio_label: 'Формат аудио по умолчанию',
    settings_system_title: 'Сведения о системе и ядре',
    settings_system_subtitle: 'Версии приложения, движков и проверка обновлений',
    tile_app_label: 'Приложение YT Deck',
    btn_check_app_update: 'Проверить обновления',
    tile_ytdlp_label: 'Модуль выгрузки',
    btn_check_ytdlp_update: 'Проверить обновления',
    tile_ffmpeg_label: 'Медиаконвертер',
    btn_download_ffmpeg: 'Установить FFmpeg',
    btn_update_ffmpeg: 'Обновить бинарник',
    tile_design_label: 'Дизайн-система',
    tile_design_sub: '7 палитр, Elevation tokens',
    tile_webview_label: 'Клиентское окно',
    tile_webview_sub: 'Аппаратное ускорение GUI',

    checking_updates: 'Проверка обновлений на GitHub…',
    new_version_available: 'Доступно обновление',
    download_update: 'Скачать установщик',
    release_notes: 'Список изменений',
    app_up_to_date: 'У вас установлена новейшая версия YT Deck',
    app_up_to_date_toast: 'У вас установлена актуальная версия YT Deck (',
    update_available_toast: 'Доступна новая версия YT Deck: ',
    update_check_error: 'Ошибка проверки обновлений',
    update_server_error: 'Не удалось связаться с сервером обновлений: ',
    toast_lang_switched: 'Язык переключён на Русский',
  },
  en: {
    brand_subtitle: 'Fast media stream downloader',
    tab_deck: 'Deck',
    tab_queue: 'Queue',
    tab_settings: 'Settings',
    ffmpeg_ok: 'FFmpeg Ready',
    ffmpeg_missing: 'FFmpeg Missing',
    ffmpeg_ok_title: 'FFmpeg is connected and ready for stream muxing',
    ffmpeg_missing_title: 'Click to automatically install FFmpeg',
    theme_toggle_title: 'Switch theme (Light / Dark)',
    lang_toggle_title: 'Switch language (EN / RU)',

    slot1_title: 'Video Stream URL',
    slot1_caption: 'Paste a YouTube video, Shorts, or playlist URL',
    slot1_label: 'YouTube video URL',
    btn_clear_url: 'Clear URL',
    btn_paste_url: 'Paste from clipboard',
    btn_probe: 'Fetch Stream',
    btn_probe_loading: 'Fetching…',
    btn_probe_found: 'Found!',
    btn_probe_error: 'Error',
    clipboard_detected: 'YouTube link detected in clipboard. Paste?',
    btn_paste: 'Paste',
    proxy_toggle: 'Network Proxy / SOCKS (Bypass Geo-blocks)',
    proxy_label: 'Proxy Address (socks5://127.0.0.1:1080 or http://...)',
    proxy_hint: 'If YouTube access is restricted by your ISP or VPN does not route CLI traffic, enter a local proxy address.',
    quick_examples_title: 'Quick Examples:',
    quick_4k: '4K Ultra HD Clip',
    quick_shorts: 'YouTube Shorts',
    quick_audio: 'Audio Podcast (MP3)',
    empty_ready: 'Ready to Download',
    empty_desc: 'Paste a video or Shorts URL in the field above, or drag and drop a link into this window',

    btn_save_thumb: 'Save Thumbnail',
    stat_views: 'views',

    slot2_title: 'Download Mode',
    slot2_caption: 'Select media stream container format',
    mode_both: 'Video + Audio (MP4)',
    mode_audio: 'Audio Only (MP3 / FLAC)',
    mode_video: 'Video Only (B-Roll)',

    slot3_title: 'Download Quality',
    slot3_caption: 'Select desired video resolution',
    slot3_title_audio: 'Audio Quality',
    slot3_caption_audio: 'Select audio format and bitrate',
    slot3_title_vonly: 'Video Quality (B-Roll)',
    slot3_caption_vonly: 'Video stream without audio track',
    quality_video_label: 'Video Resolution',
    quality_audio_label: 'Audio Format',
    preset_best_audio: 'MP3 · 320 kbps (Highest Bitrate)',
    preset_m4a: 'M4A / AAC · 256 kbps (Clean Native Audio)',
    preset_opus: 'Opus · High Quality (Web Optimized)',
    preset_flac: 'FLAC · Lossless (Studio Master Audio)',
    preset_wav: 'WAV · Uncompressed (PCM Audio)',
    preset_best_video: 'Maximum Quality',
    expert_toggle_show: 'Expert Stream Selection',
    expert_toggle_hide: 'Hide Expert Selection',
    expert_video_title: 'Video Stream Details',
    expert_video_sub: 'Resolution, frame rate, and video codec',
    expert_video_label: 'Video Stream Format',
    expert_audio_title: 'Audio Stream Details',
    expert_audio_sub: 'Bitrate, audio codec, and alternate dubs',
    expert_audio_label: 'Audio Stream Format',
    expert_track_label: 'Dub Language Selection',

    slot4_title: 'Extra Options',
    slot4_caption: 'Subtitles and timecode trimming',
    subtitles_title: 'Subtitles',
    subtitles_lang_label: 'Subtitle Language',
    subtitles_embed_label: 'Embed subtitles in container',
    subtitles_none: 'No subtitles available',
    trim_title: 'Trim Clip',
    trim_duration_prefix: 'Clip Duration: ',
    trim_start_label: 'Start (From)',
    trim_end_label: 'End (To)',
    trim_hint: 'Drag interactive timeline handles or enter exact HH:MM:SS values. Only the selected interval will be downloaded.',

    slot5_title: 'Target Directory & Start',
    slot5_caption: 'Verify save destination and begin processing',
    folder_label: 'Save Directory',
    btn_browse: 'Browse',
    btn_open_folder: 'Open',
    mode_chip_prefix: 'Mode:',
    btn_start_download: 'Download Media',
    btn_add_to_queue: 'Add to Queue',
    btn_add_to_queue_desc: 'Enqueue task for background batch processing',

    btn_cancel_download: 'Cancel Download',
    merging_stage: 'Muxing with FFmpeg…',
    download_finished_toast: 'Download completed successfully!',

    queue_title: 'Queue Manager',
    queue_caption: 'Multi-stream concurrency and bandwidth allocation',
    stat_total: 'Total: ',
    stat_active: 'Active: ',
    stat_pending: 'Pending: ',
    stat_done: 'Done: ',
    concurrency_label: 'Concurrency Mode',
    mode_sequential: 'Sequential (1 stream)',
    mode_parallel: 'Parallel (3 streams)',
    strategy_label: 'Bandwidth Priority Strategy',
    strategy_size: 'Smallest Files First',
    strategy_fifo: 'FIFO (Order of Addition)',
    strategy_manual: 'Custom Priority Ranking (High / Normal)',
    speed_limit_label: 'Total Speed Limit',
    speed_unlimited: 'Maximum (Unlimited)',
    btn_queue_start_all: 'Start All',
    btn_queue_pause_all: 'Pause All',
    btn_queue_batch: 'Batch Add URLs',
    btn_queue_clear_done: 'Clear Completed',
    queue_empty_title: 'Download Queue is Empty',
    queue_empty_desc: 'Add links via "Batch Add" or go to the "Deck" tab and click "Add to Queue" for any probed video.',
    batch_drawer_title: 'Batch URL Ingestion',
    batch_drawer_label: 'URL List (one link per line)',
    batch_drawer_placeholder: 'https://www.youtube.com/watch?v=...\nhttps://youtu.be/...\nhttps://www.youtube.com/shorts/...',
    btn_batch_submit: 'Add to Queue',
    btn_batch_close: 'Cancel',
    status_pending: 'Pending',
    status_downloading: 'Downloading',
    status_merging: 'FFmpeg Muxing',
    status_done: 'Completed',
    status_paused: 'Paused',
    status_cancelled: 'Cancelled',
    status_error: 'Error',
    btn_item_folder: 'Folder',
    btn_item_pause: 'Pause',
    btn_item_resume: 'Resume',
    btn_item_cancel: 'Cancel',
    btn_item_delete: 'Remove',
    prio_high: 'High',
    prio_normal: 'Normal',
    prio_low: 'Low',

    settings_lang_title: 'Interface Language',
    settings_lang_subtitle: 'Choose application display language',
    settings_lang_label: 'Display Language',
    settings_theme_title: 'Theme & Monet Palette Engine',
    settings_theme_subtitle: 'Personalize application appearance with Material You colors',
    settings_theme_mode_label: 'Display Mode',
    theme_dark: 'Dark',
    theme_light: 'Light',
    theme_auto: 'System',
    settings_monet_palette_label: 'Accent Palette (Monet)',
    settings_cookies_title: 'Browser Session Cookies',
    settings_cookies_subtitle: 'Bypass CAPTCHA, YouTube player bot checks, and access 18+ videos',
    settings_cookies_label: 'Browser for Session Extraction',
    settings_cookies_hint: 'Enables downloading age-restricted 18+ videos, unlisted media, and bypassing YouTube player bot verification.',
    cookies_none: 'No authentication (Default)',
    settings_folder_title: 'Default Download Directory',
    settings_folder_subtitle: 'Directory populated automatically on application startup',
    settings_folder_input_label: 'Default Folder',
    btn_reset_folder: 'Reset to ~/Downloads/YT-Deck',
    settings_adv_title: 'Advanced Settings',
    settings_adv_subtitle: 'Expert mode, default codecs, and container preferences',
    settings_expert_label: 'Expert Mode',
    settings_expert_hint: 'Display detailed video/audio stream and subtitle selection on main deck',
    settings_codec_label: 'Preferred Video Codec',
    settings_container_label: 'Default Container Format',
    settings_audio_label: 'Default Audio Format',
    settings_system_title: 'System Information & Updates',
    settings_system_subtitle: 'Application versions, engine status, and update checks',
    tile_app_label: 'YT Deck Application',
    btn_check_app_update: 'Check for Updates',
    tile_ytdlp_label: 'Extraction Core',
    btn_check_ytdlp_update: 'Update yt-dlp',
    tile_ffmpeg_label: 'Media Converter',
    btn_download_ffmpeg: 'Install FFmpeg',
    btn_update_ffmpeg: 'Update Binary',
    tile_design_label: 'Design System',
    tile_design_sub: '7 Monet palettes, Elevation tokens',
    tile_webview_label: 'Client Runtime',
    tile_webview_sub: 'Hardware-accelerated GUI',

    checking_updates: 'Checking GitHub for updates…',
    new_version_available: 'Update Available',
    download_update: 'Download Installer',
    release_notes: 'Release Notes',
    app_up_to_date: 'You have the latest version of YT Deck',
    app_up_to_date_toast: 'You are running the latest version of YT Deck (',
    update_available_toast: 'New version of YT Deck available: ',
    update_check_error: 'Failed to check for updates',
    update_server_error: 'Could not contact update server: ',
    toast_lang_switched: 'Language switched to English',
  }
};

let currentLanguage = initialSettings.language || localStorage.getItem('ytdeck_language') || 'ru';

function t(key, fallback = '') {
  if (I18N[currentLanguage] && I18N[currentLanguage][key] !== undefined) {
    return I18N[currentLanguage][key];
  }
  if (I18N['ru'] && I18N['ru'][key] !== undefined) {
    return I18N['ru'][key];
  }
  return fallback || key;
}

function applyLanguage(lang, save = true) {
  if (lang !== 'en' && lang !== 'ru') lang = 'ru';
  currentLanguage = lang;
  document.documentElement.setAttribute('lang', lang);

  if (topbarLangText) {
    topbarLangText.textContent = lang.toUpperCase();
  }

  // Update Topbar Lang button tooltip
  if (langToggleBtn) {
    langToggleBtn.title = t('lang_toggle_title', 'RU / EN');
  }

  // Update Language Segmented Control in Settings
  if (languageModeSegmented) {
    languageModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
      const isMatch = btn.dataset.lang === lang;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-checked', String(isMatch));
    });
  }

  // Translate all [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) {
      el.textContent = I18N[lang][key];
    }
  });

  // Translate all [data-i18n-placeholder]
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[lang] && I18N[lang][key]) {
      el.setAttribute('placeholder', I18N[lang][key]);
    }
  });

  // Translate all [data-i18n-title]
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (I18N[lang] && I18N[lang][key]) {
      el.setAttribute('title', I18N[lang][key]);
    }
  });

  // Translate all [data-i18n-aria-label]
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    if (I18N[lang] && I18N[lang][key]) {
      el.setAttribute('aria-label', I18N[lang][key]);
    }
  });

  // Update dynamic controls that render text
  if (typeof updateMode === 'function') updateMode();
  if (typeof updateSimpleQualityDropdown === 'function') updateSimpleQualityDropdown(currentMode);
  if (typeof updateTrimSliderUI === 'function') updateTrimSliderUI();

  // Update Topbar FFmpeg text
  if (topbarFfmpegText && topbarFfmpegPill) {
    const isOk = topbarFfmpegPill.classList.contains('ok');
    topbarFfmpegText.textContent = isOk ? t('ffmpeg_ok') : t('ffmpeg_missing');
    topbarFfmpegPill.title = isOk ? t('ffmpeg_ok_title') : t('ffmpeg_missing_title');
  }

  // Update active view if queue
  if (typeof fetchQueue === 'function' && viewQueue && !viewQueue.hidden) {
    fetchQueue();
  }

  if (save) {
    localStorage.setItem('ytdeck_language', lang);
    saveSettingsToServer({ language: lang });
  }
}

// Hook Language Switchers
if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    const nextLang = currentLanguage === 'ru' ? 'en' : 'ru';
    applyLanguage(nextLang, true);
    showToast(t('toast_lang_switched'), 'info', 2000);
  });
}

if (languageModeSegmented) {
  languageModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.lang;
      if (selectedLang && selectedLang !== currentLanguage) {
        applyLanguage(selectedLang, true);
        showToast(t('toast_lang_switched'), 'info', 2000);
      }
    });
  });
}

let currentThemeMode = initialSettings.theme_mode || localStorage.getItem('ytdeck_theme_mode') || 'dark';
let currentMonetPalette = initialSettings.monet_palette || localStorage.getItem('ytdeck_monet_palette') || 'indigo';

function applyThemeMode(mode, save = true) {
  currentThemeMode = mode;
  let effective = mode;
  if (mode === 'auto') {
    effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  document.documentElement.setAttribute('data-theme', effective);

  if (themeIconDark && themeIconLight) {
    themeIconDark.hidden = effective === 'light';
    themeIconLight.hidden = effective !== 'light';
  }

  if (themeModeSegmented) {
    themeModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
      const isMatch = btn.dataset.themeMode === mode;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-checked', String(isMatch));
    });
  }

  applyMonetPalette(currentMonetPalette, false);

  if (save) {
    localStorage.setItem('ytdeck_theme_mode', mode);
    saveSettingsToServer({ theme_mode: mode });
  }
}

function applyMonetPalette(paletteKey, save = true) {
  if (!MONET_PALETTES[paletteKey]) paletteKey = 'crimson';
  currentMonetPalette = paletteKey;

  const pal = MONET_PALETTES[paletteKey];
  const effectiveMode = document.documentElement.getAttribute('data-theme') || 'dark';
  const tokens = effectiveMode === 'light' ? pal.light : pal.dark;

  const r = document.documentElement;
  r.style.setProperty('--md-sys-color-primary', tokens.p);
  r.style.setProperty('--md-sys-color-on-primary', tokens.onP);
  r.style.setProperty('--md-sys-color-primary-container', tokens.pC);
  r.style.setProperty('--md-sys-color-on-primary-container', tokens.onPC);
  r.style.setProperty('--md-sys-color-surface-tint', tokens.sT);

  // Sync secondary variables so all tonal/secondary elements follow the Monet palette
  r.style.setProperty('--md-sys-color-secondary', tokens.p);
  r.style.setProperty('--md-sys-color-on-secondary', tokens.onP);
  r.style.setProperty('--md-sys-color-secondary-container', tokens.pC);
  r.style.setProperty('--md-sys-color-on-secondary-container', tokens.onPC);

  if (activeMonetName) activeMonetName.textContent = pal.name;

  if (monetSwatchesGrid) {
    monetSwatchesGrid.querySelectorAll('.monet-swatch').forEach((swatch) => {
      const isMatch = swatch.dataset.palette === paletteKey;
      swatch.classList.toggle('active', isMatch);
      swatch.setAttribute('aria-checked', String(isMatch));
    });
  }

  if (save) {
    localStorage.setItem('ytdeck_monet_palette', paletteKey);
    saveSettingsToServer({ monet_palette: paletteKey });
  }
}

function initMonetSwatches() {
  if (!monetSwatchesGrid) return;
  monetSwatchesGrid.innerHTML = '';

  Object.entries(MONET_PALETTES).forEach(([key, info]) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `monet-swatch md-ripple ${key === currentMonetPalette ? 'active' : ''}`;
    swatch.dataset.palette = key;
    swatch.setAttribute('role', 'radio');
    swatch.setAttribute('aria-checked', String(key === currentMonetPalette));
    swatch.title = info.name;

    swatch.innerHTML = `
      <div class="swatch-circle" style="background-color: ${info.colorHex};">
        <svg class="swatch-check" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="swatch-label">${info.name}</span>
    `;

    swatch.addEventListener('click', () => {
      applyMonetPalette(key, true);
    });

    monetSwatchesGrid.appendChild(swatch);
  });
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyThemeMode(cur === 'light' ? 'dark' : 'light', true);
  });
}

if (themeModeSegmented) {
  themeModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyThemeMode(btn.dataset.themeMode, true);
    });
  });
}

// ==========================================
// 6. SETTINGS PERSISTENCE
// ==========================================

async function saveSettingsToServer(patch) {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch (e) {
    console.error('Failed to sync settings with server:', e);
  }
}

// ==========================================
// 7. CUSTOM M3 STYLED DROPDOWN SYSTEM
// ==========================================

const activeCustomDropdowns = new Map();

function setupCustomDropdown(selectEl) {
  if (!selectEl || activeCustomDropdowns.has(selectEl)) return;

  const wrapper = selectEl.closest('.m3-select-wrapper');
  if (!wrapper) return;

  selectEl.classList.add('m3-select-hidden');

  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'm3-custom-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'm3-dropdown-trigger md-ripple';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  trigger.innerHTML = `
    <span class="m3-dropdown-text">—</span>
    <span class="m3-dropdown-arrow">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </span>
  `;

  const menu = document.createElement('div');
  menu.className = 'm3-dropdown-menu';
  menu.setAttribute('role', 'listbox');

  dropdownContainer.appendChild(trigger);
  dropdownContainer.appendChild(menu);
  wrapper.appendChild(dropdownContainer);

  function toggleMenu(open = null) {
    const isOpen = open !== null ? open : !dropdownContainer.classList.contains('open');
    if (isOpen) {
      document.querySelectorAll('.m3-custom-dropdown.open').forEach((d) => {
        if (d !== dropdownContainer) {
          d.classList.remove('open');
          d.querySelector('.m3-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    }
    dropdownContainer.classList.toggle('open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  const dropdownData = {
    container: dropdownContainer,
    trigger,
    menu,
    update: () => updateCustomDropdown(selectEl)
  };

  activeCustomDropdowns.set(selectEl, dropdownData);
  updateCustomDropdown(selectEl);

  selectEl.addEventListener('change', () => {
    updateCustomDropdown(selectEl);
  });
}

function updateCustomDropdown(selectEl) {
  const data = activeCustomDropdowns.get(selectEl);
  if (!data) return;

  const { trigger, menu } = data;
  const triggerText = trigger.querySelector('.m3-dropdown-text');
  menu.innerHTML = '';

  const options = Array.from(selectEl.options);
  if (!options.length || (options.length === 1 && options[0].disabled)) {
    triggerText.textContent = options[0]?.textContent || 'Нет доступных вариантов';
    return;
  }

  const selectedOpt = selectEl.selectedOptions[0] || options[0];
  if (selectedOpt) {
    triggerText.textContent = selectedOpt.textContent;
  }

  options.forEach((opt, idx) => {
    if (opt.disabled) return;

    const item = document.createElement('button');
    item.type = 'button';
    item.className = `m3-dropdown-item ${opt.selected ? 'active' : ''}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(opt.selected));

    const parts = opt.textContent.split('·');
    const mainLabel = parts[0]?.trim() || opt.textContent;
    const badge = parts.slice(1).join(' · ').trim();

    item.innerHTML = `
      <div class="m3-dropdown-item-left">
        <svg class="m3-dropdown-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${mainLabel}</span>
      </div>
      ${badge ? `<span class="m3-dropdown-item-badge">${badge}</span>` : ''}
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectEl.value = opt.value;
      selectEl.selectedIndex = idx;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      updateCustomDropdown(selectEl);
      data.container.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    menu.appendChild(item);
  });
}

// Global click to close open custom dropdowns
document.addEventListener('click', (e) => {
  if (!e.target.closest('.m3-custom-dropdown')) {
    document.querySelectorAll('.m3-custom-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      d.querySelector('.m3-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// ESC closes dropdowns
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.m3-custom-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      d.querySelector('.m3-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// ==========================================
// 8. SETTINGS: FOLDER & COOKIES & ENGINES
// ==========================================

const defaultFallbackDir = destInput ? destInput.value : '';
const savedDefaultDir = initialSettings.default_dir || localStorage.getItem('ytdeck_default_dir') || defaultFallbackDir;

function updateAllDirInputs(path, save = true) {
  if (destInput) destInput.value = path;
  if (settingsDefaultDirInput) settingsDefaultDirInput.value = path;
  try {
    localStorage.setItem('ytdeck_default_dir', path);
    localStorage.setItem('ytdeck_dest_dir', path);
  } catch (e) {}
  if (save && path) {
    saveSettingsToServer({ default_dir: path });
  }
}

if (savedDefaultDir) {
  updateAllDirInputs(savedDefaultDir, false);
}

if (settingsDefaultDirInput) {
  settingsDefaultDirInput.addEventListener('change', () => {
    updateAllDirInputs(settingsDefaultDirInput.value.trim(), true);
    showToast('Папка по умолчанию обновлена', 'success', 2500);
  });
}

if (resetDefaultDirBtn) {
  resetDefaultDirBtn.addEventListener('click', () => {
    updateAllDirInputs(defaultFallbackDir, true);
    showToast('Папка сброшена к стандартной', 'success', 2500);
  });
}

async function pickFolderWithDialog(targetInputEl) {
  if (folderStatus) {
    folderStatus.textContent = 'Окно выбора папки открыто на вашем компьютере…';
    folderStatus.hidden = false;
  }

  try {
    const currentPath = (settingsDefaultDirInput?.value || destInput?.value || '').trim();
    const res = await fetch('/api/select-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_folder: currentPath }),
    });
    const data = await res.json();
    if (data.ok && data.folder) {
      updateAllDirInputs(data.folder, true);
      if (folderStatus) {
        folderStatus.textContent = `Папка выбрана: ${data.folder}`;
      }
      showToast('Папка успешно изменена', 'success', 2500);
    } else {
      if (folderStatus) folderStatus.hidden = true;
    }
  } catch (e) {
    if (folderStatus) {
      folderStatus.textContent = 'Ошибка выбора папки: ' + e.message;
    }
    showToast('Не удалось открыть диалог выбора папки', 'error');
  }
}

if (selectFolderBtn) selectFolderBtn.addEventListener('click', () => pickFolderWithDialog(destInput));
if (settingsSelectFolderBtn) settingsSelectFolderBtn.addEventListener('click', () => pickFolderWithDialog(settingsDefaultDirInput));

async function openFolderInExplorer(folderPath) {
  try {
    const res = await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: folderPath }),
    });
    const data = await res.json();
    if (!data.ok) showToast('Не удалось открыть папку: ' + data.error, 'error');
  } catch (e) {
    showToast('Ошибка при открытии проводника', 'error');
  }
}

if (openFolderBtn) {
  openFolderBtn.addEventListener('click', () => {
    openFolderInExplorer(destInput ? destInput.value.trim() : '');
  });
}
if (settingsOpenFolderBtn) {
  settingsOpenFolderBtn.addEventListener('click', () => {
    openFolderInExplorer(settingsDefaultDirInput ? settingsDefaultDirInput.value.trim() : '');
  });
}
if (openDoneFolderBtn) {
  openDoneFolderBtn.addEventListener('click', async () => {
    if (lastDownloadedFilePath) {
      try {
        const res = await fetch('/api/highlight-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: lastDownloadedFilePath })
        });
        const resData = await res.json();
        if (resData.ok) return;
      } catch (e) {}
    }
    openFolderInExplorer(destInput ? destInput.value.trim() : '');
  });
}

if (playDoneFileBtn) {
  playDoneFileBtn.addEventListener('click', async () => {
    if (!lastDownloadedFilePath) {
      showToast('Файл ещё не сохранён', 'error');
      return;
    }
    try {
      const res = await fetch('/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: lastDownloadedFilePath })
      });
      const resData = await res.json();
      if (!resData.ok) {
        showToast(resData.error || 'Не удалось открыть файл', 'error');
      }
    } catch (e) {
      showToast('Ошибка воспроизведения: ' + e.message, 'error');
    }
  });
}

if (downloadAnotherBtn) {
  downloadAnotherBtn.addEventListener('click', resetDeckToEmpty);
}

// Browser Cookies Configuration
if (settingsCookiesSelect) {
  const savedCookieBrowser = initialSettings.browser_cookies || 'none';
  settingsCookiesSelect.value = savedCookieBrowser;
  setupCustomDropdown(settingsCookiesSelect);

  settingsCookiesSelect.addEventListener('change', () => {
    const val = settingsCookiesSelect.value;
    saveSettingsToServer({ browser_cookies: val });
    showToast(
      val === 'none'
        ? 'Импорт Cookies отключён'
        : `Авторизация: куки будут импортироваться из ${val.toUpperCase()}`,
      'success',
      3000
    );
  });
}

// Application Update Check (YT Deck)
async function checkAppUpdate(isManual = true) {
  if (checkAppUpdateBtn && isManual) checkAppUpdateBtn.disabled = true;
  if (appUpdateStatus && isManual) {
    appUpdateStatus.textContent = t('checking_updates', 'Проверка обновлений на GitHub…');
    appUpdateStatus.hidden = false;
  }

  try {
    const res = await fetch('/api/app_update');
    const data = await res.json();
    if (data.ok) {
      if (data.has_update) {
        showToast(`${t('update_available_toast', 'Доступна новая версия YT Deck: ')}${data.latest_version}`, 'info', 7000);

        if (engineAppVerBadge) {
          engineAppVerBadge.className = 'm3-badge update-badge--new font-mono';
          engineAppVerBadge.textContent = `${data.current_version} -> ${data.latest_version}`;
        }

        if (appUpdateStatus) {
          const setupAsset = (data.assets || []).find((a) => a.name && a.name.endsWith('_Setup.exe'));
          const portableAsset = (data.assets || []).find((a) => a.name && a.name.includes('portable.exe'));
          const downloadUrl = setupAsset ? setupAsset.download_url : (portableAsset ? portableAsset.download_url : data.release_url);

          appUpdateStatus.innerHTML = `
            <div><strong>${t('new_version_available', 'Доступно обновление')}: ${data.latest_version}</strong></div>
            <div style="margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="${downloadUrl}" target="_blank" class="m3-btn m3-btn--tonal m3-btn--small md-ripple" style="text-decoration:none;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>${t('download_update', 'Скачать установщик')}</span>
              </a>
              <a href="${data.release_url}" target="_blank" class="m3-btn m3-btn--outlined m3-btn--small md-ripple" style="text-decoration:none;">
                <span>${t('release_notes', 'Список изменений')}</span>
              </a>
            </div>
          `;
          appUpdateStatus.hidden = false;
        }
      } else {
        if (isManual) {
          showToast(`${t('app_up_to_date_toast', 'У вас установлена актуальная версия YT Deck (')}${data.current_version})`, 'success', 3500);
        }
        if (appUpdateStatus && isManual) {
          appUpdateStatus.textContent = `${t('app_up_to_date', 'У вас установлена новейшая версия YT Deck')} (${data.current_version})`;
          appUpdateStatus.hidden = false;
        }
      }
    } else {
      if (isManual) {
        showToast(data.error || t('update_check_error', 'Ошибка проверки обновлений'), 'error');
      }
      if (appUpdateStatus && isManual) {
        appUpdateStatus.textContent = data.error || t('update_check_error', 'Ошибка проверки обновлений');
        appUpdateStatus.hidden = false;
      }
    }
  } catch (e) {
    if (isManual) {
      showToast(`${t('update_server_error', 'Не удалось связаться с сервером обновлений: ')}${e.message}`, 'error');
    }
  } finally {
    if (checkAppUpdateBtn) checkAppUpdateBtn.disabled = false;
  }
}

if (checkAppUpdateBtn) {
  checkAppUpdateBtn.addEventListener('click', () => checkAppUpdate(true));
}

// Engine Updates: yt-dlp & FFmpeg
if (checkYtdlpUpdateBtn) {
  checkYtdlpUpdateBtn.addEventListener('click', async () => {
    checkYtdlpUpdateBtn.disabled = true;
    if (ytdlpUpdateStatus) {
      ytdlpUpdateStatus.textContent = 'Проверка обновлений на GitHub…';
      ytdlpUpdateStatus.hidden = false;
    }

    try {
      const res = await fetch('/api/engine/update-ytdlp', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        if (data.updated) {
          showToast(data.message, 'success', 4000);
          if (engineYtdlpVerBadge) engineYtdlpVerBadge.textContent = data.new_version;
          if (ytdlpUpdateStatus) ytdlpUpdateStatus.textContent = data.message;
        } else {
          showToast(data.message, 'success', 3000);
          if (ytdlpUpdateStatus) ytdlpUpdateStatus.textContent = data.message;
        }
      } else {
        showToast(data.error || 'Ошибка проверки обновлений', 'error');
        if (ytdlpUpdateStatus) ytdlpUpdateStatus.textContent = data.error;
      }
    } catch (e) {
      showToast('Ошибка связи с сервером обновлений: ' + e.message, 'error');
    } finally {
      checkYtdlpUpdateBtn.disabled = false;
    }
  });
}

async function triggerFfmpegDownload() {
  if (downloadFfmpegBtn) downloadFfmpegBtn.disabled = true;
  if (ffmpegDownloadStatus) {
    ffmpegDownloadStatus.textContent = 'Скачивание static-билда FFmpeg с GitHub (~35-80 МБ)…';
    ffmpegDownloadStatus.hidden = false;
  }
  showToast('Началась загрузка медиаконвертера FFmpeg…', 'success', 4000);

  try {
    const res = await fetch('/api/engine/download-ffmpeg', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      showToast(data.message, 'success', 4000);
      if (ffmpegDownloadStatus) ffmpegDownloadStatus.textContent = data.message;
      if (engineFfmpegBadge) {
        engineFfmpegBadge.textContent = 'Активен';
        engineFfmpegBadge.className = 'm3-badge m3-badge--tonal';
      }
      if (topbarFfmpegPill) {
        topbarFfmpegPill.className = 'ffmpeg-pill ok md-ripple';
        if (topbarFfmpegText) topbarFfmpegText.textContent = 'FFmpeg активен';
      }
    } else {
      showToast(data.error || 'Не удалось скачать FFmpeg', 'error');
      if (ffmpegDownloadStatus) ffmpegDownloadStatus.textContent = data.error;
    }
  } catch (e) {
    showToast('Ошибка при скачивании FFmpeg: ' + e.message, 'error');
  } finally {
    if (downloadFfmpegBtn) downloadFfmpegBtn.disabled = false;
  }
}

if (downloadFfmpegBtn) downloadFfmpegBtn.addEventListener('click', triggerFfmpegDownload);
if (topbarFfmpegPill) {
  topbarFfmpegPill.addEventListener('click', () => {
    if (topbarFfmpegPill.classList.contains('warn')) {
      triggerFfmpegDownload();
    } else {
      showToast('FFmpeg активен и готов к работе', 'success', 2000);
    }
  });
}

// Proxy Accordion Logic
if (proxyToggleBtn && proxyRow) {
  proxyToggleBtn.addEventListener('click', () => {
    const isExp = proxyToggleBtn.getAttribute('aria-expanded') === 'true';
    proxyToggleBtn.setAttribute('aria-expanded', String(!isExp));
    proxyRow.hidden = isExp;
    proxyToggleBtn.classList.toggle('expanded', !isExp);
  });
}

if (proxyInput) {
  proxyInput.value = initialSettings.proxy || '';
  proxyInput.addEventListener('change', () => {
    saveSettingsToServer({ proxy: proxyInput.value.trim() });
    showToast('Настройка прокси сохранена', 'success', 2000);
  });
}

// 8.1 ADVANCED / EXPERT SETTINGS INITIALIZATION & LISTENERS
let isCurrentExpert = Boolean(initialSettings.expert_mode);
if (channelsSection) {
  channelsSection.hidden = !isCurrentExpert;
}
if (expertChannelsWrap) {
  expertChannelsWrap.hidden = !isCurrentExpert;
}

if (settingsExpertModeSwitch) {
  settingsExpertModeSwitch.checked = isCurrentExpert;
  settingsExpertModeSwitch.addEventListener('change', (e) => {
    isCurrentExpert = e.target.checked;
    initialSettings.expert_mode = isCurrentExpert;
    if (channelsSection) channelsSection.hidden = !isCurrentExpert;
    if (expertChannelsWrap) expertChannelsWrap.hidden = !isCurrentExpert;
    saveSettingsToServer({ expert_mode: isCurrentExpert });
    showToast(isCurrentExpert ? 'Экспертный режим включён' : 'Экспертный режим отключён', 'info', 2000);
  });
}

if (settingsPrefCodec) {
  settingsPrefCodec.value = initialSettings.preferred_codec || 'auto';
  settingsPrefCodec.addEventListener('change', (e) => {
    saveSettingsToServer({ preferred_codec: e.target.value });
    showToast('Предпочитаемый кодек сохранён', 'info', 2000);
  });
  setupCustomDropdown(settingsPrefCodec);
}

if (settingsPrefContainer) {
  settingsPrefContainer.value = initialSettings.preferred_container || 'mp4';
  settingsPrefContainer.addEventListener('change', (e) => {
    saveSettingsToServer({ preferred_container: e.target.value });
    showToast('Формат контейнера сохранён', 'info', 2000);
  });
  setupCustomDropdown(settingsPrefContainer);
}

if (settingsPrefAudioFormat) {
  settingsPrefAudioFormat.value = initialSettings.preferred_audio_format || 'mp3';
  settingsPrefAudioFormat.addEventListener('change', (e) => {
    saveSettingsToServer({ preferred_audio_format: e.target.value });
    showToast('Формат аудио сохранён', 'info', 2000);
  });
  setupCustomDropdown(settingsPrefAudioFormat);
}

// ==========================================
// 9. URL INPUT & CLEAR / PASTE CONTROLS (Task 4: Zero-Friction Debounced Auto-Probe)
// ==========================================

function isYouTubeUrl(str) {
  if (!str) return false;
  return /(?:youtu\.be\/|youtube\.com\/(?:watch|shorts|playlist|live))/i.test(str);
}

function handleUrlInputChange() {
  const val = urlInput ? urlInput.value.trim() : '';
  if (clearUrlBtn) clearUrlBtn.hidden = val.length === 0;
  clearFieldError();

  if (urlDebounceTimer) {
    clearTimeout(urlDebounceTimer);
    urlDebounceTimer = null;
  }

  // Auto-probe with 700ms debounce when valid YouTube URL is typed or entered
  if (val && isYouTubeUrl(val) && val !== lastProbedUrl) {
    urlDebounceTimer = setTimeout(() => {
      if (urlInput && urlInput.value.trim() === val && val !== lastProbedUrl) {
        lastProbedUrl = val;
        probe();
      }
    }, 700);
  }
}

if (urlInput) {
  urlInput.addEventListener('input', handleUrlInputChange);
  urlInput.addEventListener('paste', (e) => {
    let pastedText = '';
    if (e.clipboardData && e.clipboardData.getData) {
      pastedText = e.clipboardData.getData('text') || '';
    }
    setTimeout(() => {
      handleUrlInputChange();
      const val = urlInput.value.trim() || pastedText.trim();
      if (val && isYouTubeUrl(val) && val !== lastProbedUrl) {
        if (urlDebounceTimer) clearTimeout(urlDebounceTimer);
        lastProbedUrl = val;
        probe();
      }
    }, 150);
  });
}

if (clearUrlBtn) {
  clearUrlBtn.addEventListener('click', () => {
    urlInput.value = '';
    lastProbedUrl = '';
    if (urlDebounceTimer) clearTimeout(urlDebounceTimer);
    handleUrlInputChange();
    urlInput.focus();
  });
}

if (pasteUrlBtn) {
  pasteUrlBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          urlInput.value = text.trim();
          handleUrlInputChange();
          lastProbedUrl = text.trim();
          probe();
        }
      } else {
        urlInput.focus();
      }
    } catch (err) {
      console.warn('Clipboard access denied:', err);
      urlInput.focus();
    }
  });
}

// ==========================================
// 10. M3 CHIPS & 3-WAY MODE LOGIC
// ==========================================

function setupChipGroup(container, onSelect) {
  if (!container) return;
  container.querySelectorAll('.m3-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.m3-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');
      onSelect(chip.dataset.value || chip.dataset.preset);
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

setupChipGroup(batchPresetChips, (v) => {
  selectedBatchPreset = v;
});

// Setup 3-Way Mode Segmented Control on Deck
if (modeSegmented) {
  modeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
    });
  });
}

// Subtitles & Trim toggles
if (subtitlesEnabled) {
  subtitlesEnabled.addEventListener('change', () => {
    if (subtitlesBody) subtitlesBody.classList.toggle('disabled', !subtitlesEnabled.checked);
  });
}

if (trimEnabled) {
  trimEnabled.addEventListener('change', () => {
    if (trimBody) trimBody.classList.toggle('disabled', !trimEnabled.checked);
  });
}

// Interactive Dual-Range Timeline Slider for Trimming
function formatSecondsToTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().replace(',', '.').split(':');
  try {
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 1) {
      return parseFloat(parts[0]) || 0;
    }
  } catch (e) {
    return 0;
  }
  return 0;
}

function updateTrimSliderUI() {
  if (!trimRangeStart || !trimRangeEnd || !trimSliderHighlight) return;
  const max = parseFloat(trimRangeStart.max) || 100;
  let valStart = parseFloat(trimRangeStart.value) || 0;
  let valEnd = parseFloat(trimRangeEnd.value) || max;

  if (valStart > valEnd) {
    valStart = valEnd;
    trimRangeStart.value = valStart;
  }
  if (valEnd < valStart) {
    valEnd = valStart;
    trimRangeEnd.value = valEnd;
  }

  const pStart = max > 0 ? (valStart / max) * 100 : 0;
  const pEnd = max > 0 ? (valEnd / max) * 100 : 100;

  trimSliderHighlight.style.left = `${pStart}%`;
  trimSliderHighlight.style.width = `${Math.max(0, pEnd - pStart)}%`;

  if (trimLblStart) trimLblStart.textContent = formatSecondsToTime(valStart);
  if (trimLblEnd) trimLblEnd.textContent = formatSecondsToTime(valEnd);

  const clipDuration = Math.max(0, valEnd - valStart);
  const clipStr = formatSecondsToTime(clipDuration);
  const durLabel = `${t('trim_duration_prefix', 'Хронометраж клипа: ')}${clipStr}`;
  if (trimLblClipInfo) trimLblClipInfo.textContent = durLabel;
  if (trimDurationBadge) trimDurationBadge.textContent = durLabel;
}

function initTrimSlider(durationSec) {
  const total = Math.max(1, Math.floor(durationSec || 0));
  if (trimRangeStart) {
    trimRangeStart.max = total;
    trimRangeStart.value = 0;
  }
  if (trimRangeEnd) {
    trimRangeEnd.max = total;
    trimRangeEnd.value = total;
  }
  if (trimStartInput) trimStartInput.value = formatSecondsToTime(0);
  if (trimEndInput) trimEndInput.value = formatSecondsToTime(total);
  if (trimDurationBadge) trimDurationBadge.hidden = false;
  updateTrimSliderUI();
}

if (trimRangeStart && trimRangeEnd) {
  trimRangeStart.addEventListener('input', () => {
    let s = parseFloat(trimRangeStart.value) || 0;
    let e = parseFloat(trimRangeEnd.value) || 0;
    if (s > e) {
      trimRangeStart.value = e;
      s = e;
    }
    if (trimStartInput) trimStartInput.value = formatSecondsToTime(s);
    updateTrimSliderUI();
  });

  trimRangeEnd.addEventListener('input', () => {
    let s = parseFloat(trimRangeStart.value) || 0;
    let e = parseFloat(trimRangeEnd.value) || 0;
    if (e < s) {
      trimRangeEnd.value = s;
      e = s;
    }
    if (trimEndInput) trimEndInput.value = formatSecondsToTime(e);
    updateTrimSliderUI();
  });
}

if (trimStartInput) {
  trimStartInput.addEventListener('change', () => {
    const s = parseTimeToSeconds(trimStartInput.value);
    if (trimRangeStart) trimRangeStart.value = s;
    updateTrimSliderUI();
  });
}

if (trimEndInput) {
  trimEndInput.addEventListener('change', () => {
    const e = parseTimeToSeconds(trimEndInput.value);
    if (trimRangeEnd) trimRangeEnd.value = e;
    updateTrimSliderUI();
  });
}

function getDubNoun(count) {
  if (currentLanguage === 'en') {
    return count === 1 ? 'dub track' : 'dub tracks';
  }
  const rem10 = count % 10;
  const rem100 = count % 100;
  if (rem100 >= 11 && rem100 <= 19) return 'дорожек';
  if (rem10 === 1) return 'дорожка';
  if (rem10 >= 2 && rem10 <= 4) return 'дорожки';
  return 'дорожек';
}

function updateAudioFormatsForTrack() {
  const trackIndex = parseInt(audioTrackSelect.value, 10) || 0;
  const track = availableAudioTracks[trackIndex];
  if (!track || !track.formats) return;

  fillSelect(
    audioSelect,
    track.formats,
    (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`
  );
  updateMode();
}

if (audioTrackSelect) {
  audioTrackSelect.addEventListener('change', updateAudioFormatsForTrack);
}

function updateMode() {
  if (videoCardStrip) videoCardStrip.hidden = currentMode === 'audio';
  if (audioCardStrip) audioCardStrip.hidden = currentMode === 'video';

  const currentTrack = (availableAudioTracks.length > 1 && audioTrackSelect && audioTrackSelect.value !== '')
    ? availableAudioTracks[parseInt(audioTrackSelect.value, 10) || 0]
    : null;
  const trackSuffix = currentTrack ? ` [${currentTrack.title.split('·')[0].trim()}]` : '';

  let text = '';
  let btnLabel = 'Скачать видео';
  const selQualityText = simplePresetSelect?.selectedOptions[0]?.textContent || '';
  const cleanQuality = selQualityText ? selQualityText.split('·')[0].trim() : '';

  if (currentMode === 'both') {
    const qPart = cleanQuality ? ` (${cleanQuality})` : '';
    text = `Видео + Звук${qPart}${trackSuffix} · ${selectedContainer.toUpperCase()}`;
    btnLabel = 'Скачать видео со звуком';
  } else if (currentMode === 'audio') {
    text = `Только аудио${trackSuffix} · ${selectedAudioFormat.toUpperCase()}`;
    btnLabel = 'Скачать аудиофайл';
  } else if (currentMode === 'video') {
    const qPart = cleanQuality ? ` (${cleanQuality})` : '';
    text = `Видеоряд${qPart} без звука · ${selectedContainer.toUpperCase()}`;
    btnLabel = 'Скачать видеоряд';
  }

  if (modeText) modeText.textContent = text;
  if (downloadBtn) {
    downloadBtn.disabled = false;
    const btnLabelSpan = downloadBtn.querySelector('.btn-label');
    if (btnLabelSpan) btnLabelSpan.textContent = btnLabel;
  }
  if (deckAddQueueBtn) deckAddQueueBtn.disabled = false;
}

function renderQualityCards(mode) {
  // Compatibility stub for cards grid (replaced by full-width M3 dropdown)
  if (qualityCardsGrid) qualityCardsGrid.innerHTML = '';
}

// ==========================================
// 10.1 SIMPLE PRESETS & EXPERT MODE CONTROLS (Task 4)
// ==========================================

function selectClosestVideoFormat(targetHeight) {
  if (!videoSelect || !videoSelect.options.length) return;
  let bestIdx = 0;
  let minDiff = 999999;
  for (let i = 0; i < videoSelect.options.length; i++) {
    const text = videoSelect.options[i].textContent || '';
    const m = text.match(/(\d+)p/);
    if (m) {
      const h = parseInt(m[1], 10);
      const diff = Math.abs(h - targetHeight);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = i;
      }
    }
  }
  videoSelect.selectedIndex = bestIdx;
  updateCustomDropdown(videoSelect);
}

function setContainerChip(val) {
  selectedContainer = val;
  if (containerChips) {
    containerChips.querySelectorAll('.m3-chip').forEach((c) => {
      const active = c.dataset.value === val;
      c.classList.toggle('active', active);
      c.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }
  updateMode();
}

function setAudioFormatChip(val) {
  selectedAudioFormat = val;
  if (audioFormatChips) {
    audioFormatChips.querySelectorAll('.m3-chip').forEach((c) => {
      const active = c.dataset.value === val;
      c.classList.toggle('active', active);
      c.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }
  updateMode();
}

function updateSimpleQualityDropdown(mode) {
  if (!simplePresetSelect) return;

  const titleEl = document.getElementById('heading-slot-quality');
  const captionEl = document.querySelector('#simple-quality-card .slot-caption');
  const labelEl = document.querySelector('.simple-preset-select-wrap .m3-field-label');

  simplePresetSelect.innerHTML = '';

  if (mode === 'audio') {
    if (titleEl) titleEl.textContent = t('slot3_title_audio', 'Качество звука');
    if (captionEl) captionEl.textContent = t('slot3_caption_audio', 'Выберите желаемый аудиоформат и битрейт');
    if (labelEl) labelEl.textContent = t('quality_audio_label', 'Формат аудио');

    const audioOptions = [
      { value: 'mp3', text: t('preset_best_audio', 'MP3 · 320 kbps (наивысший битрейт)') },
      { value: 'm4a', text: t('preset_m4a', 'M4A / AAC · 256 kbps (оригинальный чистый звук)') },
      { value: 'opus', text: t('preset_opus', 'Opus · высокое качество (веб-оптимизация)') },
      { value: 'flac', text: t('preset_flac', 'FLAC · Lossless (студийный звук без потерь)') },
      { value: 'wav', text: t('preset_wav', 'WAV · Без сжатия (несжатое аудио)') }
    ];

    audioOptions.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.text;
      if (item.value === selectedAudioFormat) opt.selected = true;
      simplePresetSelect.appendChild(opt);
    });
  } else {
    // Mode 'both' or 'video'
    const isVideoOnly = mode === 'video';
    if (titleEl) titleEl.textContent = isVideoOnly ? t('slot3_title_vonly', 'Качество видео (B-Roll)') : t('slot3_title', 'Качество загрузки');
    if (captionEl) captionEl.textContent = isVideoOnly ? t('slot3_caption_vonly', 'Только видеоряд без аудиодорожки') : t('slot3_caption', 'Выберите желаемое разрешение видеоряда');
    if (labelEl) labelEl.textContent = t('quality_video_label', 'Разрешение видео');

    let topDesc = '4K / 2K / 1080p · MP4';
    if (lastProbedVideoFormats && lastProbedVideoFormats.length) {
      const topH = lastProbedVideoFormats[0].height || 0;
      const topW = lastProbedVideoFormats[0].width || 0;
      if (topW >= 7000 || topH >= 4000) topDesc = '8K Ultra HD · MP4';
      else if (topW >= 3600 || topH >= 2000) topDesc = '4K Ultra HD · MP4';
      else if (topW >= 2400 || topH >= 1400) topDesc = '2K Quad HD · MP4';
      else if (topW >= 1800 || topH >= 1000) topDesc = '1080p Full HD · MP4';
      else if (topH > 0) topDesc = `${topH}p · MP4`;
    }

    const optBest = document.createElement('option');
    optBest.value = 'best';
    optBest.textContent = `${t('preset_best_video', 'Максимальное качество')} (${topDesc})`;
    if (selectedSimplePreset === 'best' || !selectedSimplePreset) optBest.selected = true;
    simplePresetSelect.appendChild(optBest);

    if (lastProbedVideoFormats && lastProbedVideoFormats.length) {
      // Group unique format options descending
      const seenFmt = new Set();
      lastProbedVideoFormats.forEach((f) => {
        const h = f.height || 0;
        const w = f.width || 0;
        const fmtId = f.format_id;
        if (!h || seenFmt.has(fmtId)) return;
        seenFmt.add(fmtId);

        let resName = `${h}p`;
        if (w >= 7000 || h >= 4000) resName = `${h}p (8K Ultra HD)`;
        else if (w >= 3600 || h >= 2000) resName = `${h}p (4K Ultra HD)`;
        else if (w >= 2400 || h >= 1400) resName = `${h}p (2K Quad HD)`;
        else if (w >= 1800 || h >= 1000) resName = `${h}p (Full HD)`;
        else if (w >= 1200 || h >= 700) resName = `${h}p (HD)`;
        else if (h >= 480) resName = `${h}p (SD)`;

        const sizeStr = f.size_h ? ` · ${f.size_h}` : '';
        const fpsStr = f.fps && f.fps > 30 ? ` · ${Math.round(f.fps)}fps` : '';
        const codecStr = f.codec_tag ? ` · ${f.codec_tag}` : '';

        const opt = document.createElement('option');
        opt.value = fmtId;
        opt.textContent = `${resName}${fpsStr} · MP4${sizeStr}${codecStr}`;
        if (selectedSimplePreset === fmtId || selectedSimplePreset === String(h)) {
          opt.selected = true;
        }
        simplePresetSelect.appendChild(opt);
      });
    } else {
      // Fallback presets if no probe yet
      const fallbackOptions = [
        { value: '1080', text: '1080p Full HD · Баланс качества и веса (MP4)' },
        { value: '720', text: '720p HD · Компактный размер файла (MP4)' },
        { value: '480', text: '480p SD · Экономия трафика (MP4)' }
      ];
      fallbackOptions.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.text;
        if (selectedSimplePreset === item.value) opt.selected = true;
        simplePresetSelect.appendChild(opt);
      });
    }
  }

  updateCustomDropdown(simplePresetSelect);
}

function setMode(mode) {
  currentMode = mode;
  if (modeSegmented) {
    modeSegmented.querySelectorAll('.m3-segment-btn').forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }
  updateSimpleQualityDropdown(mode);
  renderQualityCards(mode);
  updateMode();
}

function applySimplePreset(preset) {
  selectedSimplePreset = preset;
  if (simplePresetSelect && simplePresetSelect.value !== preset) {
    simplePresetSelect.value = preset;
    updateCustomDropdown(simplePresetSelect);
  }

  if (currentMode === 'audio') {
    setAudioFormatChip(preset);
  } else {
    setContainerChip('mp4');
    if (preset === 'best') {
      if (videoSelect && videoSelect.options.length > 0) {
        videoSelect.selectedIndex = 0;
        updateCustomDropdown(videoSelect);
      }
    } else {
      let matched = false;
      if (videoSelect && videoSelect.options.length) {
        for (let i = 0; i < videoSelect.options.length; i++) {
          if (videoSelect.options[i].value === preset) {
            videoSelect.selectedIndex = i;
            updateCustomDropdown(videoSelect);
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        const h = parseInt(preset, 10);
        if (!isNaN(h) && h > 0) {
          selectClosestVideoFormat(h);
        }
      }
    }
  }
  updateMode();
}

if (simplePresetSelect) {
  simplePresetSelect.addEventListener('change', (e) => {
    applySimplePreset(e.target.value);
  });
  setupCustomDropdown(simplePresetSelect);
}

if (toggleExpertModeBtn) {
  toggleExpertModeBtn.addEventListener('click', () => {
    const isHidden = expertChannelsWrap ? expertChannelsWrap.hidden : true;
    if (expertChannelsWrap) expertChannelsWrap.hidden = !isHidden;
    toggleExpertModeBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    if (expertModeToggleText) {
      expertModeToggleText.textContent = isHidden ? 'Скрыть экспертный режим' : 'Экспертный режим';
    }
    toggleExpertModeBtn.classList.toggle('active', isHidden);
  });
}

// ==========================================
// 10.2 PLAYLIST MODAL DIALOG LOGIC (Task 5)
// ==========================================

function showPlaylistModal(data) {
  currentPlaylistData = data;
  if (!playlistModal) return;

  if (playlistPreviewThumb) playlistPreviewThumb.src = data.thumbnail || '';
  if (playlistPreviewTitle) playlistPreviewTitle.textContent = data.title || 'Плейлист YouTube';
  if (playlistPreviewUploader) playlistPreviewUploader.textContent = data.uploader || 'YouTube';
  const total = data.total_count || (data.entries ? data.entries.length : 0);
  if (playlistPreviewCount) playlistPreviewCount.textContent = `${total} видео`;

  if (plRangeAll) plRangeAll.checked = true;
  if (plRangeCustom) plRangeCustom.checked = false;
  if (plRangeInputs) plRangeInputs.classList.add('disabled');
  if (plRangeStart) plRangeStart.value = 1;
  if (plRangeEnd) {
    plRangeEnd.value = total;
    plRangeEnd.max = total;
  }
  if (plConfirmLabel) plConfirmLabel.textContent = `Добавить в очередь (${total} видео)`;

  playlistModal.hidden = false;
}

function hidePlaylistModal() {
  if (playlistModal) playlistModal.hidden = true;
  currentPlaylistData = null;
}

if (playlistModalCancelBtn) {
  playlistModalCancelBtn.addEventListener('click', hidePlaylistModal);
}

if (playlistModal) {
  playlistModal.addEventListener('click', (e) => {
    if (e.target === playlistModal) hidePlaylistModal();
  });
}

function updatePlaylistCustomLabel() {
  const start = parseInt(plRangeStart?.value, 10) || 1;
  const end = parseInt(plRangeEnd?.value, 10) || start;
  const count = Math.max(1, end - start + 1);
  if (plConfirmLabel) plConfirmLabel.textContent = `Добавить в очередь (${count} видео)`;
}

if (plRangeAll) {
  plRangeAll.addEventListener('change', () => {
    if (plRangeInputs) plRangeInputs.classList.add('disabled');
    const total = currentPlaylistData ? (currentPlaylistData.total_count || currentPlaylistData.entries?.length || 0) : 0;
    if (plConfirmLabel) plConfirmLabel.textContent = `Добавить в очередь (${total} видео)`;
  });
}

if (plRangeCustom) {
  plRangeCustom.addEventListener('change', () => {
    if (plRangeInputs) plRangeInputs.classList.remove('disabled');
    updatePlaylistCustomLabel();
  });
}

if (plRangeStart) plRangeStart.addEventListener('input', updatePlaylistCustomLabel);
if (plRangeEnd) plRangeEnd.addEventListener('input', updatePlaylistCustomLabel);

setupChipGroup(plPresetChips, (v) => {
  selectedPlaylistPreset = v;
});

if (playlistModalConfirmBtn) {
  playlistModalConfirmBtn.addEventListener('click', async () => {
    if (!currentPlaylistData || !currentPlaylistData.url) return;
    const isCustom = plRangeCustom && plRangeCustom.checked;
    const total = currentPlaylistData.total_count || currentPlaylistData.entries?.length || 0;
    const start = isCustom ? (parseInt(plRangeStart.value, 10) || 1) : 1;
    const end = isCustom ? (parseInt(plRangeEnd.value, 10) || total) : total;

    playlistModalConfirmBtn.disabled = true;
    try {
      const res = await fetch('/api/queue/add-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentPlaylistData.url,
          preset: selectedPlaylistPreset,
          range_start: start,
          range_end: end,
          out_dir: destInput ? destInput.value.trim() : '',
          proxy: proxyInput ? proxyInput.value.trim() : '',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        hidePlaylistModal();
        showToast(`Плейлист добавлен в очередь (${data.added} видео)!`, 'success', 3500);
        switchTab('queue');
      } else {
        showToast(data.error || 'Ошибка добавления плейлиста в очередь', 'error', 6000);
      }
    } catch (err) {
      showToast('Ошибка сети при добавлении плейлиста', 'error', 5000);
    } finally {
      playlistModalConfirmBtn.disabled = false;
    }
  });
}

// Download Thumbnail Handler
if (downloadThumbBtn) {
  downloadThumbBtn.addEventListener('click', async () => {
    if (!currentUrl) return;
    downloadThumbBtn.disabled = true;
    showToast('Скачивание обложки видео…', 'success', 2000);

    try {
      const res = await fetch('/api/download/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentUrl,
          thumbnail_url: currentThumbnailUrl,
          title: currentTitle,
          out_dir: (settingsDefaultDirInput?.value || destInput?.value || '').trim(),
          proxy: proxyInput ? proxyInput.value.trim() : '',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Обложка сохранена: ${data.filename}`, 'success', 3500);
      } else {
        showToast(data.error || 'Не удалось сохранить обложку', 'error');
      }
    } catch (e) {
      showToast('Ошибка при скачивании обложки: ' + e.message, 'error');
    } finally {
      downloadThumbBtn.disabled = false;
    }
  });
}

// ==========================================
// 11. URL PROBE & STREAM INSPECTION
// ==========================================

function showActionableError(errorMsg) {
  if (!actionableErrorBanner) return;
  const msg = errorMsg || 'Не удалось получить данные о видео.';
  if (errorBannerDesc) errorBannerDesc.textContent = msg;

  const isCookieIssue = /cookie|sign in|18\+|private|bot|защита|капча|авториз/i.test(msg);
  const isProxyIssue = /proxy|timeout|connect|таймаут|прокси|network|сеть|заблокирован/i.test(msg);
  const isFolderIssue = /space|disk|папк|диск|permission|доступ|write/i.test(msg);

  if (errActionCookies) errActionCookies.hidden = !isCookieIssue;
  if (errActionProxy) errActionProxy.hidden = !isProxyIssue;
  if (errActionFolder) errActionFolder.hidden = !isFolderIssue;

  if (isCookieIssue) {
    actionableErrorBanner.classList.add('warning-style');
    if (errorBannerTitle) errorBannerTitle.textContent = 'Требуется авторизация для доступа';
  } else {
    actionableErrorBanner.classList.remove('warning-style');
    if (errorBannerTitle) errorBannerTitle.textContent = 'Не удалось получить данные о видео';
  }

  actionableErrorBanner.hidden = false;
}

function hideActionableError() {
  if (actionableErrorBanner) actionableErrorBanner.hidden = true;
}

if (errorBannerCloseBtn) {
  errorBannerCloseBtn.addEventListener('click', hideActionableError);
}

if (errActionCookies) {
  errActionCookies.addEventListener('click', () => {
    switchTab('settings');
    const cookieCard = document.getElementById('heading-settings-cookies');
    if (cookieCard) cookieCard.scrollIntoView({ behavior: 'smooth' });
  });
}

if (errActionProxy) {
  errActionProxy.addEventListener('click', () => {
    if (proxyRow) proxyRow.hidden = false;
    if (proxyToggleBtn) {
      proxyToggleBtn.setAttribute('aria-expanded', 'true');
      proxyToggleBtn.classList.add('expanded');
    }
    if (proxyInput) proxyInput.focus();
  });
}

if (errActionFolder) {
  errActionFolder.addEventListener('click', () => {
    if (selectFolderBtn) selectFolderBtn.click();
  });
}

function resetDeckToEmpty() {
  currentUrl = '';
  currentTitle = '';
  currentUploader = '';
  currentThumbnailUrl = '';
  lastDownloadedFilePath = '';
  if (urlInput) urlInput.value = '';
  handleUrlInputChange();

  if (trackCard) trackCard.hidden = true;
  if (modeSlot) modeSlot.hidden = true;
  if (simpleQualityCard) simpleQualityCard.hidden = true;
  if (channelsSection) channelsSection.hidden = true;
  if (extraOptionsSlot) extraOptionsSlot.hidden = true;
  if (transferSection) transferSection.hidden = true;
  if (progressBlock) progressBlock.hidden = true;
  if (doneBanner) doneBanner.hidden = true;
  if (skeletonCard) skeletonCard.hidden = true;
  if (emptyStateSection) emptyStateSection.hidden = false;
  hideActionableError();
  setProbeBtnState('idle', 'Найти видео');
}

function setProbeBtnState(state, label = null) {
  if (!probeBtn) return;
  probeBtn.setAttribute('data-state', state);
  const labelEl = probeBtn.querySelector('.btn-label');

  if (state === 'loading') {
    probeBtn.disabled = true;
    if (labelEl) labelEl.textContent = label || 'Анализ…';
  } else if (state === 'success') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Найдено!';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'success') {
        setProbeBtnState('idle', 'Найти видео');
      }
    }, 2500);
  } else if (state === 'error') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Ошибка';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'error') {
        setProbeBtnState('idle', 'Найти видео');
      }
    }, 2500);
  } else if (state === 'empty') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Вставьте URL';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'empty') {
        setProbeBtnState('idle', 'Найти видео');
      }
    }, 2000);
  } else {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Найти видео';
  }
}

if (probeBtn) probeBtn.addEventListener('click', probe);
if (urlInput) {
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') probe();
  });
}

async function probe() {
  const url = urlInput.value.trim();
  clearFieldError();
  hideActionableError();

  if (!url) {
    setFieldError('Пожалуйста, вставьте ссылку на ролик YouTube.');
    setProbeBtnState('empty', 'Вставьте URL');
    urlInput.focus();
    showToast('Поле ввода пустое. Вставьте ссылку на YouTube', 'error', 3000);
    return;
  }

  setProbeBtnState('loading', 'Анализ…');
  if (skeletonCard) skeletonCard.hidden = false;
  if (emptyStateSection) emptyStateSection.hidden = true;
  if (trackCard) trackCard.hidden = true;
  if (modeSlot) modeSlot.hidden = true;
  if (simpleQualityCard) simpleQualityCard.hidden = true;
  if (channelsSection) channelsSection.hidden = true;
  if (extraOptionsSlot) extraOptionsSlot.hidden = true;
  if (transferSection) transferSection.hidden = true;
  if (doneBanner) doneBanner.hidden = true;

  try {
    const res = await fetch('/api/probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        proxy: proxyInput ? proxyInput.value.trim() : '',
      }),
    });

    const data = await res.json();
    if (skeletonCard) skeletonCard.hidden = true;

    if (!data.ok) {
      setProbeBtnState('error', 'Ошибка');
      showToast(data.error || 'Не удалось получить данные о видео.', 'error', 6000);
      setFieldError(data.error || 'Ошибка считывания потока.');
      if (emptyStateSection) emptyStateSection.hidden = false;
      showActionableError(data.error);
      return;
    }

    // Task 5: Handle playlist metadata preview
    if (data.is_playlist) {
      setProbeBtnState('success', 'Плейлист');
      showPlaylistModal(data);
      return;
    }

    currentUrl = url;
    currentTitle = data.title || 'Видео';
    currentUploader = data.uploader || '';
    currentThumbnailUrl = data.thumbnail || '';
    currentDuration = data.duration || '';
    currentDurationSec = data.duration_sec || 0;
    currentEstimatedSize = (data.video_formats && data.video_formats[0] && data.video_formats[0].size) || 0;

    setProbeBtnState('success', 'Найдено!');

    // Populate video metadata card
    if (trackThumb) trackThumb.src = currentThumbnailUrl;
    if (trackTitle) trackTitle.textContent = currentTitle;
    if (trackUploader) trackUploader.textContent = currentUploader;
    if (trackDuration) trackDuration.textContent = currentDuration;

    if (trackViews) {
      if (data.views) {
        trackViews.textContent = data.views;
        trackViews.hidden = false;
      } else {
        trackViews.hidden = true;
      }
    }

    if (trackDate) {
      if (data.upload_date) {
        trackDate.textContent = data.upload_date;
        trackDate.hidden = false;
      } else {
        trackDate.hidden = true;
      }
    }

    if (trackCard) trackCard.hidden = false;

    // Fill Video Resolution Formats
    fillSelect(
      videoSelect,
      data.video_formats,
      (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`
    );

    // Fill Audio Tracks & Multi-language Dubs
    availableAudioTracks = data.audio_tracks || [];
    if (availableAudioTracks.length > 1) {
      if (audioTrackWrap) audioTrackWrap.hidden = false;
      const count = availableAudioTracks.length;
      if (audioTrackBadge) audioTrackBadge.textContent = `${count} ${getDubNoun(count)}`;

      if (audioTrackSelect) {
        audioTrackSelect.innerHTML = '';
        availableAudioTracks.forEach((track, index) => {
          const opt = document.createElement('option');
          opt.value = index;
          opt.textContent = track.title;
          audioTrackSelect.appendChild(opt);
        });
        audioTrackSelect.selectedIndex = 0;
        updateCustomDropdown(audioTrackSelect);
        updateAudioFormatsForTrack();
      }
    } else {
      if (audioTrackWrap) audioTrackWrap.hidden = true;
      const defaultFormats = data.audio_formats || (availableAudioTracks[0] ? availableAudioTracks[0].formats : []);
      fillSelect(
        audioSelect,
        defaultFormats,
        (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`
      );
    }

    // Fill Subtitles Dropdown
    availableSubtitles = data.subtitles || [];
    if (subtitlesSelect) {
      subtitlesSelect.innerHTML = '';
      if (availableSubtitles.length) {
        availableSubtitles.forEach((s) => {
          const opt = document.createElement('option');
          opt.value = s.code;
          opt.textContent = `${s.name} (${s.code})`;
          subtitlesSelect.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = 'none';
        opt.textContent = 'Субтитры не найдены';
        opt.disabled = true;
        subtitlesSelect.appendChild(opt);
      }
      updateCustomDropdown(subtitlesSelect);
    }

    // Show interactive panels
    if (emptyStateSection) emptyStateSection.hidden = true;
    if (modeSlot) modeSlot.hidden = false;
    if (simpleQualityCard) simpleQualityCard.hidden = false;
    if (channelsSection) channelsSection.hidden = !isCurrentExpert;
    if (extraOptionsSlot) extraOptionsSlot.hidden = false;
    if (transferSection) transferSection.hidden = false;
    if (progressBlock) progressBlock.hidden = true;
    if (doneBanner) doneBanner.hidden = true;

    // Initialize interactive dual-range trim slider with actual video duration
    initTrimSlider(data.duration_sec);

    // Populate simple presets dropdown with probed video and audio streams
    lastProbedVideoFormats = data.video_formats || [];
    lastProbedAudioFormats = data.audio_formats || [];
    updateSimpleQualityDropdown(currentMode);
    renderQualityCards(currentMode);
    applySimplePreset(currentMode === 'audio' ? selectedAudioFormat : 'best');
    updateMode();

    if (trackCard) trackCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    if (skeletonCard) skeletonCard.hidden = true;
    if (emptyStateSection) emptyStateSection.hidden = false;
    setProbeBtnState('error', 'Сбой сети');
    showToast('Ошибка соединения с локальным сервером: ' + e.message, 'error');
    showActionableError('Ошибка соединения с локальным сервером: ' + e.message);
  }
}

function fillSelect(select, items, labelFn) {
  if (!select) return;
  select.innerHTML = '';
  if (!items || !items.length) {
    const opt = document.createElement('option');
    opt.textContent = 'Нет доступных вариантов';
    opt.disabled = true;
    select.appendChild(opt);
    updateCustomDropdown(select);
    return;
  }
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.format_id;
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });

  updateCustomDropdown(select);
}

// ==========================================
// 12. DIRECT DOWNLOAD LIFECYCLE & CANCEL
// ==========================================

// M3 Split Button Dropdown Toggle
if (splitMenuToggleBtn && splitDropdownMenu) {
  splitMenuToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = splitMenuToggleBtn.getAttribute('aria-expanded') === 'true';
    splitMenuToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    splitDropdownMenu.hidden = isExpanded;
  });

  document.addEventListener('click', (e) => {
    if (!splitDropdownMenu.hidden && !splitDropdownMenu.contains(e.target) && e.target !== splitMenuToggleBtn) {
      splitDropdownMenu.hidden = true;
      splitMenuToggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

if (downloadBtn) downloadBtn.addEventListener('click', startDirectDownload);

let activeJobPollInterval = null;

function stopJobPolling() {
  if (activeJobPollInterval) {
    clearInterval(activeJobPollInterval);
    activeJobPollInterval = null;
  }
}

function handleDownloadProgressUpdate(data) {
  if (!currentJobId) return;
  const targetId = data.job_id || data.id;
  if (targetId && targetId !== currentJobId) return;

  const linearProg = progressBlock ? progressBlock.querySelector('.m3-linear-progress') : null;

  if (data.status === 'starting') {
    if (linearProg) linearProg.classList.add('indeterminate');
    if (progressStatus) progressStatus.textContent = data.phase_label || 'Подключение к YouTube…';
    if (progressStats) progressStats.textContent = 'Инициализация загрузки…';
  } else if (data.status === 'downloading') {
    if (linearProg) linearProg.classList.remove('indeterminate');
    const rawPct = (data.percent !== undefined) ? data.percent : ((data.progress !== undefined) ? data.progress : 0);
    const pct = Math.min(100, Math.max(0, rawPct));
    if (ledFill) ledFill.style.width = `${pct}%`;
    if (progressStatus) progressStatus.textContent = data.phase_label || `Скачиваем (${Math.round(pct)}%)`;
    const dlText = data.downloaded || '—';
    const totText = data.total || '—';
    const spdText = data.speed || '';
    if (progressStats) progressStats.textContent = `${dlText} / ${totText}${spdText ? ' · ' + spdText : ''}`;
  } else if (data.status === 'merging') {
    if (linearProg) linearProg.classList.add('indeterminate');
    if (progressStatus) {
      progressStatus.innerHTML = `<span class="merging-pulse">${GEAR_SPIN_SVG} ${data.stage_text || data.message || 'Склейка дорожек через FFmpeg. Для длинных видео это может занять 1–2 минуты, пожалуйста, подождите…'}</span>`;
    }
    if (progressStats) progressStats.textContent = 'FFmpeg склейка…';
  } else if (data.status === 'done') {
    stopJobPolling();
    if (linearProg) linearProg.classList.remove('indeterminate');
    if (ledFill) ledFill.style.width = '100%';
    if (progressStatus) progressStatus.textContent = 'Готово';
    if (progressStats) progressStats.textContent = '';
    if (doneBanner) doneBanner.hidden = false;
    lastDownloadedFilename = data.filename || 'video.mp4';
    lastDownloadedFilePath = data.path || data.file_path || (data.folder ? `${data.folder}/${lastDownloadedFilename}` : '');
    if (doneFilename) doneFilename.textContent = lastDownloadedFilename;
    if (data.folder) updateAllDirInputs(data.folder, false);
    if (downloadBtn) downloadBtn.disabled = false;
    if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = false;
    showToast('Загрузка успешно завершена!', 'success', 3500);
  } else if (data.status === 'cancelled') {
    stopJobPolling();
    if (linearProg) linearProg.classList.remove('indeterminate');
    if (progressBlock) progressBlock.hidden = true;
    if (downloadBtn) downloadBtn.disabled = false;
    if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = false;
    showToast('Загрузка отменена', 'error', 2500);
  } else if (data.status === 'error') {
    stopJobPolling();
    if (linearProg) linearProg.classList.remove('indeterminate');
    const errText = data.error || 'Ошибка загрузки';
    showToast('Ошибка загрузки: ' + errText, 'error', 8000);
    showActionableError('Ошибка при загрузке: ' + errText);
    if (progressStatus) progressStatus.textContent = errText;
    if (progressStats) progressStats.textContent = 'Загрузка остановлена';
    if (downloadBtn) downloadBtn.disabled = false;
    if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = false;
  }
}

async function startDirectDownload() {
  if (!currentUrl) return;

  if (splitDropdownMenu) splitDropdownMenu.hidden = true;
  if (splitMenuToggleBtn) splitMenuToggleBtn.setAttribute('aria-expanded', 'false');

  const payload = {
    url: currentUrl,
    title: currentTitle,
    mode: currentMode,
    video_format_id: videoSelect ? videoSelect.value : '',
    audio_format_id: audioSelect ? audioSelect.value : '',
    container: selectedContainer,
    audio_codec: selectedAudioFormat,
    out_dir: (settingsDefaultDirInput?.value || destInput?.value || '').trim(),
    proxy: proxyInput ? proxyInput.value.trim() : '',
    subtitles_enabled: subtitlesEnabled ? subtitlesEnabled.checked : false,
    subtitles_lang: subtitlesSelect ? subtitlesSelect.value : '',
    subtitles_embed: subtitlesEmbed ? subtitlesEmbed.checked : false,
    trim_enabled: trimEnabled ? trimEnabled.checked : false,
    trim_start: trimStartInput ? trimStartInput.value.trim() : '',
    trim_end: trimEndInput ? trimEndInput.value.trim() : '',
  };

  downloadBtn.disabled = true;
  if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = true;
  if (doneBanner) doneBanner.hidden = true;
  if (progressBlock) progressBlock.hidden = false;
  if (ledFill) {
    ledFill.style.width = '0%';
  }
  const linearProg = progressBlock ? progressBlock.querySelector('.m3-linear-progress') : null;
  if (linearProg) linearProg.classList.add('indeterminate');

  if (progressStatus) progressStatus.textContent = 'Подключение к YouTube…';
  if (progressStats) progressStats.textContent = 'Инициализация загрузки…';

  stopJobPolling();

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

    // Start background fallback poller in case websocket events lag or drop
    activeJobPollInterval = setInterval(async () => {
      if (!currentJobId) {
        stopJobPolling();
        return;
      }
      try {
        const resp = await fetch(`/api/job/${currentJobId}`);
        if (!resp.ok) return;
        const resData = await resp.json();
        if (resData.ok && resData.job) {
          handleDownloadProgressUpdate(resData.job);
        }
      } catch (_) {}
    }, 800);
  } catch (e) {
    stopJobPolling();
    showToast(e.message, 'error', 5000);
    if (downloadBtn) downloadBtn.disabled = false;
    if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = false;
    if (progressBlock) progressBlock.hidden = true;
  }
}

if (cancelDownloadBtn) {
  cancelDownloadBtn.addEventListener('click', async () => {
    if (!currentJobId) return;
    cancelDownloadBtn.disabled = true;
    stopJobPolling();
    try {
      await fetch('/api/download/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: currentJobId }),
      });
      showToast('Отмена загрузки…', 'info', 2000);
      if (progressBlock) progressBlock.hidden = true;
      if (downloadBtn) downloadBtn.disabled = false;
      if (splitMenuToggleBtn) splitMenuToggleBtn.disabled = false;
    } catch (e) {
      console.error('Cancel request error:', e);
    } finally {
      cancelDownloadBtn.disabled = false;
    }
  });
}

// Socket.IO Single Download Listener
socket.on('progress', (data) => {
  handleDownloadProgressUpdate(data);
});

// ==========================================
// 13. QUEUE SYSTEM: ACTIONS, BATCH & PROGRESS
// ==========================================

// Add current video from Deck tab to Queue
if (deckAddQueueBtn) {
  deckAddQueueBtn.addEventListener('click', async () => {
    if (splitDropdownMenu) splitDropdownMenu.hidden = true;
    if (splitMenuToggleBtn) splitMenuToggleBtn.setAttribute('aria-expanded', 'false');

    if (!currentUrl) {
      showToast('Сначала вставьте ссылку и нажмите «Найти видео»', 'error', 3000);
      return;
    }

    const payload = {
      url: currentUrl,
      title: currentTitle,
      uploader: currentUploader,
      thumbnail: currentThumbnailUrl,
      duration: currentDuration,
      duration_sec: currentDurationSec,
      estimated_size: currentEstimatedSize,
      mode: currentMode,
      video_format_id: videoSelect ? videoSelect.value : '',
      audio_format_id: audioSelect ? audioSelect.value : '',
      container: selectedContainer,
      audio_codec: selectedAudioFormat,
      out_dir: (settingsDefaultDirInput?.value || destInput?.value || '').trim(),
      proxy: proxyInput ? proxyInput.value.trim() : '',
      subtitles_enabled: subtitlesEnabled ? subtitlesEnabled.checked : false,
      subtitles_lang: subtitlesSelect ? subtitlesSelect.value : '',
      subtitles_embed: subtitlesEmbed ? subtitlesEmbed.checked : false,
      trim_enabled: trimEnabled ? trimEnabled.checked : false,
      trim_start: trimStartInput ? trimStartInput.value.trim() : '',
      trim_end: trimEndInput ? trimEndInput.value.trim() : '',
    };

    deckAddQueueBtn.disabled = true;
    try {
      const res = await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Ролик успешно добавлен в очередь!', 'success', 3000);
        renderQueue(data.queue);
      } else {
        showToast(data.error || 'Не удалось добавить в очередь', 'error');
      }
    } catch (e) {
      showToast('Ошибка добавления: ' + e.message, 'error');
    } finally {
      deckAddQueueBtn.disabled = false;
    }
  });
}

// Queue Concurrency Mode (Sequential vs Parallel)
if (queueModeSegmented) {
  queueModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.queueMode;
      queueModeSegmented.querySelectorAll('.m3-segment-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');

      await updateQueueSettingsOnServer({ mode });
      showToast(
        mode === 'sequential'
          ? 'Режим: по очереди (1 ролик · 100% скорости канала)'
          : 'Режим: все вместе (до 3 параллельных потоков)',
        'success',
        2500
      );
    });
  });
}

// Strategy selector
if (queueStrategySelect) {
  setupCustomDropdown(queueStrategySelect);
  queueStrategySelect.addEventListener('change', async () => {
    const strategy = queueStrategySelect.value;
    await updateQueueSettingsOnServer({ strategy });
    showToast('Приоритет распределения скорости обновлён', 'success', 2000);
  });
}

// Speed limit selector
if (queueSpeedSelect) {
  setupCustomDropdown(queueSpeedSelect);
  queueSpeedSelect.addEventListener('change', async () => {
    const speed = parseInt(queueSpeedSelect.value, 10) || 0;
    await updateQueueSettingsOnServer({ speed_limit_mb: speed });
    showToast(
      speed === 0 ? 'Лимит скорости снят (Максимум)' : `Лимит скорости установлен: ${speed} МБ/с`,
      'success',
      2500
    );
  });
}

async function updateQueueSettingsOnServer(patch) {
  try {
    const res = await fetch('/api/queue/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!data.ok) showToast('Не удалось обновить настройки очереди', 'error');
  } catch (e) {
    console.error('Queue settings update error:', e);
  }
}

// Global Queue Action buttons
if (queueResumeAllBtn) {
  queueResumeAllBtn.addEventListener('click', () => sendQueueAction('resume_all'));
}
if (queuePauseAllBtn) {
  queuePauseAllBtn.addEventListener('click', () => sendQueueAction('pause_all'));
}
if (queueClearDoneBtn) {
  queueClearDoneBtn.addEventListener('click', () => sendQueueAction('clear_completed'));
}

async function sendQueueAction(action, itemId = null, extra = {}) {
  try {
    const payload = { action, item_id: itemId, ...extra };
    const res = await fetch('/api/queue/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) {
      renderQueue(data.queue);
    }
  } catch (e) {
    console.error('Queue action error:', e);
  }
}

// Batch Add Drawer Toggle & Submit
if (queueToggleBatchBtn && batchAddDrawer) {
  queueToggleBatchBtn.addEventListener('click', () => {
    batchAddDrawer.hidden = !batchAddDrawer.hidden;
    if (!batchAddDrawer.hidden && batchUrlsInput) {
      batchUrlsInput.focus();
    }
  });
}

if (closeBatchDrawerBtn && batchAddDrawer) {
  closeBatchDrawerBtn.addEventListener('click', () => {
    batchAddDrawer.hidden = true;
  });
}

if (batchSubmitBtn && batchUrlsInput) {
  batchSubmitBtn.addEventListener('click', async () => {
    const text = batchUrlsInput.value.trim();
    if (!text) {
      showToast('Вставьте ссылки на YouTube', 'error', 2500);
      return;
    }

    batchSubmitBtn.disabled = true;
    showToast('Добавление списка в очередь…', 'success', 2000);

    try {
      const res = await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: text,
          preset: selectedBatchPreset,
          out_dir: (settingsDefaultDirInput?.value || destInput?.value || '').trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        batchUrlsInput.value = '';
        if (batchAddDrawer) batchAddDrawer.hidden = true;
        showToast(`Добавлено ${data.added} роликов в очередь!`, 'success', 3500);
        renderQueue(data.queue);
      } else {
        showToast(data.error || 'Ошибка добавления ссылок', 'error');
      }
    } catch (e) {
      showToast('Ошибка при отправке ссылок: ' + e.message, 'error');
    } finally {
      batchSubmitBtn.disabled = false;
    }
  });
}

// Fetch Queue from Server
async function fetchQueue() {
  try {
    const res = await fetch('/api/queue');
    const data = await res.json();
    if (data.ok && data.queue) {
      renderQueue(data.queue);
    }
  } catch (e) {
    console.error('Fetch queue error:', e);
  }
}

// Render Queue View
function renderQueue(queueData) {
  if (!queueData) return;
  const items = queueData.items || [];
  const settings = queueData.settings || {};
  const stats = queueData.stats || {};

  // Update Stats Counters
  if (qStatTotal) qStatTotal.textContent = stats.total || 0;
  if (qStatActive) qStatActive.textContent = stats.active || 0;
  if (qStatPending) qStatPending.textContent = stats.pending || 0;
  if (qStatDone) qStatDone.textContent = stats.done || 0;

  // Update Topbar Queue Badge
  const waitingOrActive = (stats.pending || 0) + (stats.active || 0);
  if (queueCountBadge) {
    queueCountBadge.textContent = waitingOrActive;
    queueCountBadge.hidden = waitingOrActive === 0;
  }

  // Sync Concurrency Segmented Control
  if (queueModeSegmented && settings.mode) {
    queueModeSegmented.querySelectorAll('.m3-segment-btn').forEach((b) => {
      const isMatch = b.dataset.queueMode === settings.mode;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-checked', String(isMatch));
    });
  }

  // Sync Strategy Dropdown
  if (queueStrategySelect && settings.strategy && queueStrategySelect.value !== settings.strategy) {
    queueStrategySelect.value = settings.strategy;
    updateCustomDropdown(queueStrategySelect);
  }

  // Sync Speed Dropdown
  if (queueSpeedSelect && settings.speed_limit_mb !== undefined) {
    const sVal = String(settings.speed_limit_mb);
    if (queueSpeedSelect.value !== sVal) {
      queueSpeedSelect.value = sVal;
      updateCustomDropdown(queueSpeedSelect);
    }
  }

  if (!queueItemsContainer) return;
  queueItemsContainer.innerHTML = '';

  if (!items.length) {
    queueItemsContainer.innerHTML = `
      <div class="m3-card m3-card--outlined queue-empty-state">
        <div class="empty-icon-badge">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
        <h3 class="empty-title">${t('queue_empty_title', 'Очередь выгрузки пуста')}</h3>
        <p class="empty-desc">${t('queue_empty_desc', 'Добавьте несколько ссылок через «Пакетный ввод» или перейдите на вкладку «Загрузка» и нажмите «В очередь» для любого настроенного ролика.')}</p>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `m3-card m3-card--outlined queue-item-card queue-item--${item.status || 'pending'}`;
    card.id = `queue-item-${item.id}`;

    // Format badge text
    let statusText = t('status_pending', 'В очереди');
    let statusClass = 'tonal';
    if (item.status === 'downloading') {
      statusText = t('status_downloading', 'Скачивается');
      statusClass = 'primary';
    } else if (item.status === 'merging') {
      statusText = t('status_merging', 'Склейка FFmpeg');
      statusClass = 'primary';
    } else if (item.status === 'done') {
      statusText = t('status_done', 'Завершено');
      statusClass = 'success';
    } else if (item.status === 'paused') {
      statusText = t('status_paused', 'На паузе');
      statusClass = 'warn';
    } else if (item.status === 'cancelled') {
      statusText = t('status_cancelled', 'Отменено');
      statusClass = 'warn';
    } else if (item.status === 'error') {
      statusText = t('status_error', 'Ошибка');
      statusClass = 'error';
    }

    const pct = item.progress || 0;
    const isRunning = item.status === 'downloading' || item.status === 'merging';

    // Format mode / container label
    const modeLabel = item.mode === 'audio'
      ? `${t('mode_audio', 'Аудио')} · ${item.audio_codec?.toUpperCase() || 'MP3'}`
      : `${t('mode_both', 'Видео')} · ${item.container?.toUpperCase() || 'MP4'}`;

    card.innerHTML = `
      <div class="q-item-left">
        <div class="q-item-thumb-wrap">
          <img src="${item.thumbnail || 'static/img/placeholder.svg'}" alt="Обложка" onerror="this.style.display='none'" />
          ${item.duration ? `<span class="m3-badge m3-badge--overlay q-dur-badge">${item.duration}</span>` : ''}
        </div>
      </div>

      <div class="q-item-center">
        <div class="q-item-topline">
          <h4 class="q-item-title" title="${item.title || item.url}">${item.title || item.url}</h4>
          <span class="m3-badge m3-badge--${statusClass} q-status-pill">${statusText}</span>
        </div>

        <div class="q-item-subline">
          <span class="q-item-sub">${item.uploader || 'YouTube'}</span>
          <span class="q-dot">·</span>
          <span class="q-item-sub font-mono">${modeLabel}</span>
          ${item.filename ? `<span class="q-dot">·</span><span class="q-item-filename font-mono">${item.filename}</span>` : ''}
          ${item.error ? `<span class="q-item-err">${item.error}</span>` : ''}
        </div>

        <!-- Live Progress bar -->
        <div class="q-item-progress-wrap ${isRunning ? 'active' : ''}">
          <div class="m3-linear-progress" role="progressbar" aria-valuenow="${pct}">
            <div class="m3-progress-track"></div>
            <div class="m3-progress-indicator" style="width: ${pct}%;"></div>
          </div>
          <div class="q-item-stats font-mono">
            <span>${pct}%</span>
            <span>${item.speed || ''}</span>
            <span>${item.downloaded ? item.downloaded + ' / ' + item.total : ''}</span>
            <span>${item.eta ? 'ETA ' + item.eta : ''}</span>
          </div>
        </div>
      </div>

      <div class="q-item-right">
        <!-- Priority Selector -->
        <div class="q-priority-control" title="${t('prio_tooltip', 'Приоритет задачи')}">
          <select class="m3-select q-prio-select font-mono" data-item-id="${item.id}">
            <option value="high" ${item.priority === 'high' ? 'selected' : ''}>${t('prio_high', 'Высокий')}</option>
            <option value="normal" ${item.priority === 'normal' || !item.priority ? 'selected' : ''}>${t('prio_normal', 'Обычный')}</option>
            <option value="low" ${item.priority === 'low' ? 'selected' : ''}>${t('prio_low', 'Низкий')}</option>
          </select>
        </div>

        <!-- Reorder Buttons -->
        <div class="q-reorder-btns">
          <button type="button" class="m3-icon-btn m3-icon-btn--small q-move-up-btn md-ripple" data-item-id="${item.id}" title="${t('btn_move_up', 'Переместить вверх')}" ${index === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button type="button" class="m3-icon-btn m3-icon-btn--small q-move-down-btn md-ripple" data-item-id="${item.id}" title="${t('btn_move_down', 'Переместить вниз')}" ${index === items.length - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <!-- Item Action Buttons -->
        <div class="q-item-actions">
          ${isRunning ? `
            <button type="button" class="m3-btn m3-btn--tonal m3-btn--small q-pause-btn md-ripple" data-item-id="${item.id}" title="${t('btn_item_pause', 'Пауза')}">${t('btn_item_pause', 'Пауза')}</button>
            <button type="button" class="m3-btn m3-btn--outlined m3-btn--small q-cancel-btn md-ripple" data-item-id="${item.id}" title="${t('btn_item_cancel', 'Отмена')}">${t('btn_item_cancel', 'Отмена')}</button>
          ` : ''}
          ${item.status === 'pending' ? `
            <button type="button" class="m3-btn m3-btn--tonal m3-btn--small q-pause-btn md-ripple" data-item-id="${item.id}" title="${t('btn_item_pause', 'Пауза')}">${t('btn_item_pause', 'Пауза')}</button>
          ` : ''}
          ${item.status === 'paused' || item.status === 'error' || item.status === 'cancelled' ? `
            <button type="button" class="m3-btn m3-btn--tonal m3-btn--small q-resume-btn md-ripple" data-item-id="${item.id}" title="${t('btn_item_resume', 'Продолжить')}">${t('btn_item_resume', 'Продолжить')}</button>
          ` : ''}
          ${item.status === 'done' ? `
            <button type="button" class="m3-btn m3-btn--tonal m3-btn--small q-open-folder-btn md-ripple" data-folder="${item.out_dir}" title="${t('btn_item_folder', 'Папка')}">${t('btn_item_folder', 'Папка')}</button>
          ` : ''}
          <button type="button" class="m3-icon-btn m3-icon-btn--small q-delete-btn md-ripple" data-item-id="${item.id}" title="${t('btn_item_delete', 'Удалить')}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    // Priority change listener
    const prioSelect = card.querySelector('.q-prio-select');
    if (prioSelect) {
      prioSelect.addEventListener('change', (e) => {
        sendQueueAction('item_priority', item.id, { priority: e.target.value });
      });
    }

    // Move Up / Down
    const moveUpBtn = card.querySelector('.q-move-up-btn');
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', () => sendQueueAction('move_up', item.id));
    }
    const moveDownBtn = card.querySelector('.q-move-down-btn');
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', () => sendQueueAction('move_down', item.id));
    }

    // Pause / Resume / Cancel / Delete
    const pauseBtn = card.querySelector('.q-pause-btn');
    if (pauseBtn) pauseBtn.addEventListener('click', () => sendQueueAction('item_pause', item.id));

    const resumeBtn = card.querySelector('.q-resume-btn');
    if (resumeBtn) resumeBtn.addEventListener('click', () => sendQueueAction('item_resume', item.id));

    const cancelBtn = card.querySelector('.q-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => sendQueueAction('item_cancel', item.id));

    const deleteBtn = card.querySelector('.q-delete-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => sendQueueAction('item_delete', item.id));

    const openFBtn = card.querySelector('.q-open-folder-btn');
    if (openFBtn) openFBtn.addEventListener('click', () => openFolderInExplorer(item.out_dir));

    queueItemsContainer.appendChild(card);
  });
}

// Socket.IO Queue Realtime Listeners
socket.on('queue_updated', (data) => {
  renderQueue(data);
});

socket.on('queue_progress', (data) => {
  if (!data || !data.id) return;
  const card = document.getElementById(`queue-item-${data.id}`);
  if (!card) return;

  const linearProg = card.querySelector('.m3-linear-progress');
  const indicator = card.querySelector('.m3-progress-indicator');

  if (data.status === 'merging') {
    if (linearProg) linearProg.classList.add('indeterminate');
    card.classList.add('queue-item--merging');
  } else {
    if (linearProg) linearProg.classList.remove('indeterminate');
    card.classList.remove('queue-item--merging');
    if (indicator) indicator.style.width = `${data.percent || 0}%`;
  }

  const statsEl = card.querySelector('.q-item-stats');
  if (statsEl) {
    if (data.status === 'merging') {
      statsEl.innerHTML = `
        <span class="m3-color-primary font-weight-bold">99%</span>
        <span class="merging-pulse">${GEAR_SPIN_SVG} ${data.stage_text || data.message || 'Склейка дорожек через FFmpeg…'}</span>
      `;
    } else {
      const phaseBadge = data.phase === 'video' ? ' · Видео' : (data.phase === 'audio' ? ' · Аудио' : '');
      statsEl.innerHTML = `
        <span>${data.percent || 0}%${phaseBadge}</span>
        <span>${data.speed || ''}</span>
        <span>${data.downloaded ? data.downloaded + ' / ' + data.total : ''}</span>
        <span>${data.eta ? 'ETA ' + data.eta : ''}</span>
      `;
    }
  }

  if (data.status === 'merging') {
    const badge = card.querySelector('.q-status-pill') || card.querySelector('.q-badge--status');
    if (badge) {
      badge.textContent = 'Склейка FFmpeg';
      badge.className = 'm3-badge m3-badge--primary q-status-pill';
    }
  }
});

// ==========================================
// 14. MODERN REDESIGN: DRAG & DROP, CLIPBOARD, QUICK CHIPS
// ==========================================

// Drag & Drop Handling
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (dragDropOverlay) dragDropOverlay.hidden = false;
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (dragDropOverlay) dragDropOverlay.hidden = false;
});

window.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) {
    if (dragDropOverlay) dragDropOverlay.hidden = true;
  }
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (dragDropOverlay) dragDropOverlay.hidden = true;

  const dt = e.dataTransfer;
  if (!dt) return;

  const text = dt.getData('text/plain');
  if (text && text.trim()) {
    const lines = text.trim().split(/\r?\n/);
    const validUrl = lines.find((l) => l.includes('youtu.be') || l.includes('youtube.com'));
    if (validUrl && urlInput) {
      urlInput.value = validUrl.trim();
      handleUrlInputChange();
      probe();
      return;
    }
  }

  if (dt.files && dt.files.length) {
    const file = dt.files[0];
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target.result;
        const lines = content.split(/\r?\n/);
        const validUrl = lines.find((l) => l.includes('youtu.be') || l.includes('youtube.com'));
        if (validUrl && urlInput) {
          urlInput.value = validUrl.trim();
          handleUrlInputChange();
          probe();
        } else {
          showToast('В файле не найдено ссылок YouTube', 'error', 3000);
        }
      };
      reader.readAsText(file);
    }
  }
});

// Smart Clipboard Detection
let lastCheckedClipboard = '';
async function checkClipboardForYouTubeLink() {
  if (!clipboardDetectChip || !navigator.clipboard || !navigator.clipboard.readText) return;
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return;
    const trimmed = text.trim();
    if (trimmed === lastCheckedClipboard || (urlInput && trimmed === urlInput.value.trim())) return;
    if (
      trimmed.includes('youtube.com/watch') ||
      trimmed.includes('youtu.be/') ||
      trimmed.includes('youtube.com/shorts/') ||
      trimmed.includes('youtube.com/playlist')
    ) {
      lastCheckedClipboard = trimmed;
      clipboardDetectChip.hidden = false;
    }
  } catch (err) {
    // Clipboard permission not granted or background window
  }
}

window.addEventListener('focus', checkClipboardForYouTubeLink);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkClipboardForYouTubeLink();
  }
});

if (chipPasteBtn) {
  chipPasteBtn.addEventListener('click', () => {
    if (lastCheckedClipboard && urlInput) {
      urlInput.value = lastCheckedClipboard;
      handleUrlInputChange();
      if (clipboardDetectChip) clipboardDetectChip.hidden = true;
      probe();
    }
  });
}

if (chipDismissBtn) {
  chipDismissBtn.addEventListener('click', () => {
    if (clipboardDetectChip) clipboardDetectChip.hidden = true;
  });
}

// Quick Scenario Chips
document.querySelectorAll('.quick-scenario-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    const exampleType = btn.dataset.example;
    if (exampleType === '4k') {
      urlInput.value = 'https://www.youtube.com/watch?v=LXb3EKWsInQ';
      setMode('both');
    } else if (exampleType === 'shorts') {
      urlInput.value = 'https://www.youtube.com/shorts/5v4pP0tW3H0';
      setMode('both');
    } else if (exampleType === 'audio') {
      urlInput.value = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';
      setMode('audio');
    }
    handleUrlInputChange();
    probe();
  });
});

// ==========================================
// 15. INITIALIZATION CALLS
// ==========================================

applyThemeMode(currentThemeMode, false);
initMonetSwatches();

if (videoSelect) setupCustomDropdown(videoSelect);
if (audioSelect) setupCustomDropdown(audioSelect);
if (audioTrackSelect) setupCustomDropdown(audioTrackSelect);
if (subtitlesSelect) setupCustomDropdown(subtitlesSelect);

updateSimpleQualityDropdown(currentMode);
renderQualityCards(currentMode);
updateMode();
handleUrlInputChange();

// Initial fetch of Queue on application start
fetchQueue();

// Initialize UI Language
applyLanguage(currentLanguage, false);

// Silent background check for YT Deck application updates (after startup settling)
setTimeout(() => {
  checkAppUpdate(false);
}, 3500);

// ==========================================
// 16. PREVIEW CONTROLLER (Documentation & Showcase)
// ==========================================

function initPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get('preview');
  if (!preview) return;
  try {

  const sampleThumb = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14141e"/>
      <stop offset="50%" stop-color="#1e1e2d"/>
      <stop offset="100%" stop-color="#2a1b2d"/>
    </linearGradient>
    <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ba1a1a" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#7c3aed" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bgGrad)"/>
  <circle cx="320" cy="180" r="140" fill="url(#aurora)" filter="blur(20px)"/>
  <path d="M 0 240 Q 180 180 340 220 T 640 180 L 640 360 L 0 360 Z" fill="#0f0f15" opacity="0.9"/>
  <polygon points="295,150 365,180 295,210" fill="#ffffff" opacity="0.95"/>
  <rect x="24" y="24" width="92" height="28" rx="6" fill="#ba1a1a"/>
  <text x="70" y="43" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="13" text-anchor="middle">4K 60FPS</text>
  <rect x="124" y="24" width="56" height="28" rx="6" fill="rgba(255,255,255,0.15)"/>
  <text x="152" y="43" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="13" text-anchor="middle">HDR</text>
</svg>
`);

  if (preview === 'hero' || preview === 'trim') {
    applyThemeMode('dark', false);
    applyMonetPalette('crimson', false);

    // Cancel debounce probe
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
      urlDebounceTimer = null;
    }
    probe = async () => {};

    if (urlInput) {
      urlInput.value = 'https://www.youtube.com/watch?v=WCtJ_EZQQBM';
      lastProbedUrl = urlInput.value;
      if (clearUrlBtn) clearUrlBtn.hidden = false;
      if (urlSupportingError) urlSupportingError.hidden = true;
    }

    currentUrl = 'https://www.youtube.com/watch?v=WCtJ_EZQQBM';
    currentTitle = 'Costa Rica in 4K 60fps HDR (Ultra HD)';
    currentUploader = 'Jacob + Katie Schwarz';
    currentThumbnailUrl = sampleThumb;
    currentDuration = '05:14';
    currentDurationSec = 314;
    currentEstimatedSize = 1488977920;

    setProbeBtnState('success', 'Найдено!');

    if (trackThumb) trackThumb.src = sampleThumb;
    if (trackTitle) trackTitle.textContent = currentTitle;
    if (trackUploader) trackUploader.textContent = currentUploader;
    if (trackDuration) trackDuration.textContent = currentDuration;
    if (trackViews) {
      trackViews.textContent = '112 450 000 просмотров';
      trackViews.hidden = false;
    }
    if (trackDate) {
      trackDate.textContent = '14 окт. 2023 г.';
      trackDate.hidden = false;
    }

    if (skeletonCard) skeletonCard.hidden = true;
    if (emptyStateSection) emptyStateSection.hidden = true;
    if (extraOptionsSlot) extraOptionsSlot.hidden = false;
    if (transferSection) transferSection.hidden = false;

    if (preview === 'hero') {
      if (trackCard) trackCard.hidden = false;
      if (modeSlot) modeSlot.hidden = false;
      if (simpleQualityCard) simpleQualityCard.hidden = false;
    } else {
      if (trackCard) trackCard.hidden = true;
      if (modeSlot) modeSlot.hidden = true;
      if (simpleQualityCard) simpleQualityCard.hidden = true;
    }

    // Fill Video Formats
    const mockVideoFormats = [
      { format_id: '313', label: '3840x2160 (4K 60fps HDR) · VP9', height: 2160, width: 3840, size_h: '1.42 GB', ext: 'webm' },
      { format_id: '271', label: '2560x1440 (2K 60fps) · VP9', height: 1440, width: 2560, size_h: '820 MB', ext: 'webm' },
      { format_id: '137', label: '1920x1080 (1080p 60fps) · H.264', height: 1080, width: 1920, size_h: '410 MB', ext: 'mp4' },
      { format_id: '136', label: '1280x720 (720p 60fps) · H.264', height: 720, width: 1280, size_h: '185 MB', ext: 'mp4' }
    ];
    lastProbedVideoFormats = mockVideoFormats;
    fillSelect(videoSelect, mockVideoFormats, (f) => `${f.label}${f.size_h ? ' · ' + f.size_h : ''}`);

    // Fill Audio Tracks
    availableAudioTracks = [
      { title: 'English (Original Audio)', formats: [{ format_id: '251', label: 'Opus 160 kbps', size_h: '6.2 MB' }] },
      { title: 'Русский (Полный дубляж)', formats: [{ format_id: '251-ru', label: 'Opus 160 kbps', size_h: '6.1 MB' }] },
      { title: 'Español (Doblaje oficial)', formats: [{ format_id: '251-es', label: 'Opus 160 kbps', size_h: '6.0 MB' }] }
    ];
    if (audioTrackWrap) audioTrackWrap.hidden = false;
    if (audioTrackBadge) audioTrackBadge.textContent = '3 дубляжа';
    if (audioTrackSelect) {
      audioTrackSelect.innerHTML = '';
      availableAudioTracks.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = t.title;
        audioTrackSelect.appendChild(opt);
      });
      updateCustomDropdown(audioTrackSelect);
    }

    fillSelect(audioSelect, [{ format_id: '251', label: 'Opus 160 kbps (Высокое качество)', size_h: '6.2 MB' }], (f) => `${f.label} · ${f.size_h}`);

    updateSimpleQualityDropdown('both');

    if (preview === 'trim') {
      if (trackCard) trackCard.hidden = true;
      if (modeSlot) modeSlot.hidden = true;
      if (simpleQualityCard) simpleQualityCard.hidden = true;

      const trimCheckbox = $('trim-enabled');
      const trimBody = $('trim-body');
      if (trimCheckbox) trimCheckbox.checked = true;
      if (trimBody) trimBody.classList.remove('disabled');
      initTrimSlider(314);
      if (trimRangeStart) trimRangeStart.value = 45;
      if (trimRangeEnd) trimRangeEnd.value = 185;
      if (trimStartInput) trimStartInput.value = '00:00:45';
      if (trimEndInput) trimEndInput.value = '00:03:05';
      updateTrimSliderUI();
    }
  } else if (preview === 'queue') {
    applyThemeMode('dark', false);
    applyMonetPalette('crimson', false);
    switchTab('queue');
    fetchQueue = async () => {};

    const mockData = {
      settings: { mode: 'parallel', strategy: 'fifo', speed_limit_mb: 0 },
      stats: { total: 4, active: 1, pending: 1, done: 2 },
      items: [
        {
          id: 'preview-1',
          title: 'Interstellar — Docking Scene in IMAX 4K 60fps HDR',
          uploader: 'Paramount Pictures',
          status: 'downloading',
          progress: 68,
          speed: '54.8 MB/s',
          downloaded: '1.42 GB',
          total: '2.10 GB',
          eta: '00:13',
          mode: 'both',
          container: 'mp4',
          duration: '04:18',
          filename: 'Interstellar_Docking_Scene_4K.mp4',
          priority: 'high',
          thumbnail: sampleThumb
        },
        {
          id: 'preview-2',
          title: 'Hans Zimmer — Live in Prague (FLAC 24-bit Lossless Audio)',
          uploader: 'Hans Zimmer Official',
          status: 'merging',
          progress: 99,
          speed: '',
          downloaded: '',
          total: '',
          eta: '',
          stage_text: 'Сведение через FFmpeg...',
          mode: 'audio',
          audio_codec: 'flac',
          duration: '07:22',
          filename: 'Hans_Zimmer_Live_Prague.flac',
          priority: 'normal',
          thumbnail: sampleThumb
        },
        {
          id: 'preview-3',
          title: 'Cyberpunk 2077: Phantom Liberty — Official Cinematic Trailer 8K',
          uploader: 'CD PROJEKT RED',
          status: 'done',
          progress: 100,
          speed: '',
          downloaded: '3.42 GB',
          total: '3.42 GB',
          eta: '',
          mode: 'both',
          container: 'mp4',
          duration: '03:45',
          filename: 'Cyberpunk_Phantom_Liberty_8K.mp4',
          priority: 'normal',
          thumbnail: sampleThumb
        },
        {
          id: 'preview-4',
          title: 'BBC Earth — Frozen Planet II: High Arctic Aerial View',
          uploader: 'BBC Earth',
          status: 'pending',
          progress: 0,
          speed: '',
          downloaded: '',
          total: '4.80 GB',
          eta: '',
          mode: 'both',
          container: 'mkv',
          duration: '09:12',
          filename: 'Frozen_Planet_II_High_Arctic.mkv',
          priority: 'low',
          thumbnail: sampleThumb
        }
      ]
    };

    renderQueue(mockData);
    setTimeout(() => renderQueue(mockData), 200);
    setTimeout(() => renderQueue(mockData), 600);
  } else if (preview === 'settings') {
    applyThemeMode('dark', false);
    applyMonetPalette('crimson', false);
    switchTab('settings');
  }
  } catch (err) {
    console.warn('Preview mode initialization error:', err);
  }
}

initPreviewMode();
