/**
 * YT Deck — Client Controller (Material Design 3 Expressive)
 * Features:
 * - M3 Topbar Tab Navigation (Deck vs Settings)
 * - Monet Dynamic Theming (7 Harmonious M3 Palettes with custom primary & containers)
 * - Theme Modes (Dark, Light, System Auto)
 * - Custom Styled M3 Dropdown Menus (Styled Popups with checkmarks & badges)
 * - Default Download Folder configuration with Explorer picker & persistence
 * - Floating Snackbar / Toast for system notifications (MargyT style)
 * - Inline M3 supporting text & error states on URL field
 * - Live Socket.IO download progress
 */

// Initialize Socket.IO connection
const socket = io();

// Helper selector
const $ = (id) => document.getElementById(id);

// Navigation Elements
const tabDeckBtn = $('tab-deck-btn');
const tabSettingsBtn = $('tab-settings-btn');
const viewDeck = $('view-deck');
const viewSettings = $('view-settings');

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

// Settings Elements
const monetSwatchesGrid = $('monet-swatches-grid');
const activeMonetName = $('active-monet-name');
const settingsDefaultDirInput = $('settings-default-dir-input');
const settingsSelectFolderBtn = $('settings-select-folder-btn');
const settingsOpenFolderBtn = $('settings-open-folder-btn');
const resetDefaultDirBtn = $('reset-default-dir-btn');

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

// Channels Section & Controls
const channelsSection = $('channels');
const videoEnabled = $('video-enabled');
const audioEnabled = $('audio-enabled');
const videoBody = $('video-body');
const audioBody = $('audio-body');
const videoSelect = $('video-select');
const audioSelect = $('audio-select');
const audioTrackWrap = $('audio-track-wrap');
const audioTrackSelect = $('audio-track-select');
const audioTrackBadge = $('audio-track-badge');
const containerChips = $('container-chips');
const audioFormatChips = $('audio-format-chips');

// Transfer / Save Section
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
const doneBanner = $('done-banner');
const doneFilename = $('done-filename');
const openDoneFolderBtn = $('open-done-folder-btn');

// State Variables
let currentUrl = '';
let selectedContainer = 'mp4';
let selectedAudioFormat = 'mp3';
let currentJobId = null;
let lastDownloadedFilename = '';
let availableAudioTracks = [];

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
// 4. M3 TOPBAR NAVIGATION (DECK VS SETTINGS)
// ==========================================

function switchTab(tabName) {
  const isDeck = tabName === 'deck';

  if (tabDeckBtn && tabSettingsBtn) {
    tabDeckBtn.classList.toggle('active', isDeck);
    tabDeckBtn.setAttribute('aria-selected', String(isDeck));
    tabSettingsBtn.classList.toggle('active', !isDeck);
    tabSettingsBtn.setAttribute('aria-selected', String(!isDeck));
  }

  if (viewDeck) viewDeck.hidden = !isDeck;
  if (viewSettings) viewSettings.hidden = isDeck;
}

if (tabDeckBtn) {
  tabDeckBtn.addEventListener('click', () => switchTab('deck'));
}
if (tabSettingsBtn) {
  tabSettingsBtn.addEventListener('click', () => switchTab('settings'));
}

// ==========================================
// 5. MONET DYNAMIC PALETTE ENGINE
// ==========================================

const MONET_PALETTES = {
  crimson: {
    id: 'crimson',
    name: 'YouTube Crimson',
    key: '#E5252A',
    dark: {
      primary: '#FFB4AB',
      onPrimary: '#690005',
      primaryContainer: '#93000A',
      onPrimaryContainer: '#FFDAD6',
      surfaceTint: '#FFB4AB',
    },
    light: {
      primary: '#BA1A1A',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDAD6',
      onPrimaryContainer: '#410002',
      surfaceTint: '#BA1A1A',
    }
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    key: '#F59E0B',
    dark: {
      primary: '#FFBA38',
      onPrimary: '#442C00',
      primaryContainer: '#624000',
      onPrimaryContainer: '#FFDF9E',
      surfaceTint: '#FFBA38',
    },
    light: {
      primary: '#805600',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDF9E',
      onPrimaryContainer: '#2B1A00',
      surfaceTint: '#805600',
    }
  },
  blue: {
    id: 'blue',
    name: 'Ocean Azure',
    key: '#2563EB',
    dark: {
      primary: '#B2C5FF',
      onPrimary: '#002B73',
      primaryContainer: '#1B449A',
      onPrimaryContainer: '#DAE2FF',
      surfaceTint: '#B2C5FF',
    },
    light: {
      primary: '#2E5AAC',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DAE2FF',
      onPrimaryContainer: '#001847',
      surfaceTint: '#2E5AAC',
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Forest',
    key: '#10B981',
    dark: {
      primary: '#7CDA7B',
      onPrimary: '#003A08',
      primaryContainer: '#005312',
      onPrimaryContainer: '#98F895',
      surfaceTint: '#7CDA7B',
    },
    light: {
      primary: '#1B6D24',
      onPrimary: '#FFFFFF',
      primaryContainer: '#98F895',
      onPrimaryContainer: '#002203',
      surfaceTint: '#1B6D24',
    }
  },
  violet: {
    id: 'violet',
    name: 'Electric Violet',
    key: '#8B5CF6',
    dark: {
      primary: '#CFBCFF',
      onPrimary: '#381E72',
      primaryContainer: '#4F378B',
      onPrimaryContainer: '#EADDFF',
      surfaceTint: '#CFBCFF',
    },
    light: {
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#21005D',
      surfaceTint: '#6750A4',
    }
  },
  rose: {
    id: 'rose',
    name: 'Sunset Rose',
    key: '#EC4899',
    dark: {
      primary: '#FFB1C8',
      onPrimary: '#5E1133',
      primaryContainer: '#7B2949',
      onPrimaryContainer: '#FFD9E2',
      surfaceTint: '#FFB1C8',
    },
    light: {
      primary: '#984061',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFD9E2',
      onPrimaryContainer: '#3E001D',
      surfaceTint: '#984061',
    }
  },
  teal: {
    id: 'teal',
    name: 'Mint & Teal',
    key: '#00897B',
    dark: {
      primary: '#80D5CB',
      onPrimary: '#003732',
      primaryContainer: '#005049',
      onPrimaryContainer: '#9CF1E7',
      surfaceTint: '#80D5CB',
    },
    light: {
      primary: '#006A62',
      onPrimary: '#FFFFFF',
      primaryContainer: '#9CF1E7',
      onPrimaryContainer: '#00201D',
      surfaceTint: '#006A62',
    }
  }
};

let currentMonetPalette = localStorage.getItem('ytdeck_monet_palette') || 'crimson';

function applyMonetPalette(paletteId) {
  const palette = MONET_PALETTES[paletteId] || MONET_PALETTES.crimson;
  currentMonetPalette = palette.id;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const tokens = currentTheme === 'light' ? palette.light : palette.dark;

  const root = document.documentElement;
  root.style.setProperty('--md-sys-color-primary', tokens.primary);
  root.style.setProperty('--md-sys-color-on-primary', tokens.onPrimary);
  root.style.setProperty('--md-sys-color-primary-container', tokens.primaryContainer);
  root.style.setProperty('--md-sys-color-on-primary-container', tokens.onPrimaryContainer);
  root.style.setProperty('--md-sys-color-surface-tint', tokens.surfaceTint);

  if (activeMonetName) {
    activeMonetName.textContent = palette.name;
  }

  // Update swatches selection
  if (monetSwatchesGrid) {
    monetSwatchesGrid.querySelectorAll('.monet-swatch').forEach((swatch) => {
      const isActive = swatch.dataset.paletteId === palette.id;
      swatch.classList.toggle('active', isActive);
      swatch.setAttribute('aria-checked', String(isActive));
    });
  }

  try {
    localStorage.setItem('ytdeck_monet_palette', palette.id);
  } catch (e) {}
}

function initMonetSwatches() {
  if (!monetSwatchesGrid) return;
  monetSwatchesGrid.innerHTML = '';

  Object.values(MONET_PALETTES).forEach((palette) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `monet-swatch md-ripple ${palette.id === currentMonetPalette ? 'active' : ''}`;
    swatch.dataset.paletteId = palette.id;
    swatch.setAttribute('role', 'radio');
    swatch.setAttribute('aria-checked', String(palette.id === currentMonetPalette));
    swatch.title = palette.name;

    swatch.innerHTML = `
      <span class="swatch-circle" style="background-color: ${palette.key};">
        <svg class="swatch-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span class="swatch-label">${palette.name.split(' ')[0]}</span>
    `;

    swatch.addEventListener('click', () => {
      applyMonetPalette(palette.id);
      showToast(`Цветовая палитра: ${palette.name}`, 'success', 2000);
    });

    monetSwatchesGrid.appendChild(swatch);
  });
}

// ==========================================
// 6. M3 THEME SYSTEM (DARK / LIGHT / AUTO)
// ==========================================

let currentThemeMode = localStorage.getItem('ytdeck_theme_mode') || 'dark';

function resolveEffectiveTheme(mode) {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

function applyThemeMode(mode) {
  currentThemeMode = mode;
  const effectiveTheme = resolveEffectiveTheme(mode);
  document.documentElement.setAttribute('data-theme', effectiveTheme);

  const isDark = effectiveTheme === 'dark';
  if (themeIconDark && themeIconLight) {
    themeIconDark.hidden = isDark;
    themeIconLight.hidden = !isDark;
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#141212' : '#FCF8F7');
  }

  // Update Segmented Control Buttons in Settings
  if (themeModeSegmented) {
    themeModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
      const active = btn.dataset.themeMode === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', String(active));
    });
  }

  // Re-apply monet palette with new tone balance
  applyMonetPalette(currentMonetPalette);

  try {
    localStorage.setItem('ytdeck_theme_mode', mode);
  } catch (e) {}
}

// Media Query Listener for Auto Theme
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (currentThemeMode === 'auto') {
    applyThemeMode('auto');
  }
});

// Settings Segmented Control listener
if (themeModeSegmented) {
  themeModeSegmented.querySelectorAll('.m3-segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyThemeMode(btn.dataset.themeMode);
      showToast(`Тема переключена: ${btn.textContent.trim()}`, 'success', 2000);
    });
  });
}

// Quick Topbar Theme Toggle Button
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const nextMode = currentThemeMode === 'dark' ? 'light' : 'dark';
    applyThemeMode(nextMode);
  });
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
    <span class="m3-dropdown-arrow">▾</span>
  `;

  const menu = document.createElement('div');
  menu.className = 'm3-dropdown-menu';
  menu.setAttribute('role', 'listbox');

  dropdownContainer.appendChild(trigger);
  dropdownContainer.appendChild(menu);
  wrapper.appendChild(dropdownContainer);

  function toggleMenu(open = null) {
    const isOpen = open !== null ? open : !dropdownContainer.classList.contains('open');
    // Close other dropdowns
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
// 8. SETTINGS: DEFAULT FOLDER MANAGEMENT
// ==========================================

const defaultFallbackDir = destInput ? destInput.value : '';
const savedDefaultDir = localStorage.getItem('ytdeck_default_dir') || defaultFallbackDir;

function updateAllDirInputs(path) {
  if (destInput) destInput.value = path;
  if (settingsDefaultDirInput) settingsDefaultDirInput.value = path;
  try {
    localStorage.setItem('ytdeck_default_dir', path);
    localStorage.setItem('ytdeck_dest_dir', path);
  } catch (e) {}
}

if (savedDefaultDir) {
  updateAllDirInputs(savedDefaultDir);
}

if (settingsDefaultDirInput) {
  settingsDefaultDirInput.addEventListener('change', () => {
    updateAllDirInputs(settingsDefaultDirInput.value.trim());
    showToast('Папка по умолчанию обновлена', 'success', 2500);
  });
}

if (resetDefaultDirBtn) {
  resetDefaultDirBtn.addEventListener('click', () => {
    updateAllDirInputs(defaultFallbackDir);
    showToast('Папка сброшена к стандартной', 'success', 2500);
  });
}

async function pickFolderWithDialog(targetInputEl) {
  const originalHtml = targetInputEl ? targetInputEl.innerHTML : '';
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
      updateAllDirInputs(data.folder);
      if (folderStatus) {
        folderStatus.textContent = '✓ Выбрана папка: ' + data.folder;
        folderStatus.hidden = false;
      }
      showToast('Папка успешно выбрана: ' + data.folder, 'success', 3000);
    } else if (data.cancelled) {
      if (folderStatus) folderStatus.hidden = true;
    } else if (data.error) {
      showToast('Ошибка выбора папки: ' + data.error, 'error');
    }
  } catch (err) {
    showToast('Не удалось связаться с сервером диалога папки', 'error');
  }
}

if (settingsSelectFolderBtn) {
  settingsSelectFolderBtn.addEventListener('click', () => pickFolderWithDialog(settingsSelectFolderBtn));
}

if (selectFolderBtn) {
  selectFolderBtn.addEventListener('click', () => pickFolderWithDialog(selectFolderBtn));
}

async function openCurrentFolder() {
  const folder = (settingsDefaultDirInput?.value || destInput?.value || '').trim();
  try {
    await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
  } catch (err) {
    showToast('Не удалось открыть папку в проводнике', 'error');
  }
}

if (openFolderBtn) openFolderBtn.addEventListener('click', openCurrentFolder);
if (settingsOpenFolderBtn) settingsOpenFolderBtn.addEventListener('click', openCurrentFolder);
if (openDoneFolderBtn) openDoneFolderBtn.addEventListener('click', openCurrentFolder);

// ==========================================
// 9. PROXY & CLIPBOARD ACTIONS
// ==========================================

try {
  const savedProxy = localStorage.getItem('ytdeck_proxy') || '';
  if (savedProxy && proxyInput) {
    proxyInput.value = savedProxy;
    proxyRow.hidden = false;
    proxyToggleBtn?.setAttribute('aria-expanded', 'true');
    const chevron = proxyToggleBtn?.querySelector('.chevron');
    if (chevron) chevron.textContent = '▴';
  }
} catch (e) {}

if (proxyToggleBtn) {
  proxyToggleBtn.addEventListener('click', () => {
    const isHidden = !proxyRow.hidden;
    proxyRow.hidden = isHidden;
    proxyToggleBtn.setAttribute('aria-expanded', String(!isHidden));
    const chevron = proxyToggleBtn.querySelector('.chevron');
    if (chevron) chevron.textContent = isHidden ? '▾' : '▴';
  });
}

if (proxyInput) {
  proxyInput.addEventListener('change', () => {
    try {
      localStorage.setItem('ytdeck_proxy', proxyInput.value.trim());
    } catch (e) {}
  });
}

function handleUrlInputChange() {
  const val = urlInput.value.trim();
  if (clearUrlBtn) clearUrlBtn.hidden = !val;
  if (val) {
    clearFieldError();
    if (probeBtn && (probeBtn.getAttribute('data-state') === 'empty' || probeBtn.getAttribute('data-state') === 'error')) {
      setProbeBtnState('idle', 'Считать');
    }
  }
}

if (urlInput) {
  urlInput.addEventListener('input', handleUrlInputChange);
  urlInput.addEventListener('change', handleUrlInputChange);
}

if (clearUrlBtn) {
  clearUrlBtn.addEventListener('click', () => {
    urlInput.value = '';
    handleUrlInputChange();
    urlInput.focus();
    clearFieldError();
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
          probe();
        }
      } else {
        urlInput.focus();
      }
    } catch (err) {
      console.warn('Clipboard access denied/unavailable:', err);
      urlInput.focus();
    }
  });
}

// ==========================================
// 10. M3 CHIPS & MODE LOGIC
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

function getDubNoun(count) {
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
  const vOn = videoEnabled ? videoEnabled.checked : true;
  const aOn = audioEnabled ? audioEnabled.checked : true;

  if (videoBody) videoBody.classList.toggle('disabled', !vOn);
  if (audioBody) audioBody.classList.toggle('disabled', !aOn);

  const currentTrack = (availableAudioTracks.length > 1 && audioTrackSelect && audioTrackSelect.value !== '')
    ? availableAudioTracks[parseInt(audioTrackSelect.value, 10) || 0]
    : null;
  const trackSuffix = currentTrack ? ` [${currentTrack.title.split('·')[0].trim()}]` : '';

  let text = '';
  if (vOn && aOn) {
    text = `Видео + звук${trackSuffix} · склейка в ${selectedContainer.toUpperCase()}`;
  } else if (vOn && !aOn) {
    text = 'Только видеопоток (без звука)';
  } else if (!vOn && aOn) {
    text = `Только аудиодорожка${trackSuffix} · ${selectedAudioFormat.toUpperCase()}`;
  } else {
    text = 'Выберите хотя бы один канал для скачивания';
  }

  if (modeText) modeText.textContent = text;
  if (downloadBtn) downloadBtn.disabled = !(vOn || aOn);
}

if (videoEnabled) videoEnabled.addEventListener('change', updateMode);
if (audioEnabled) audioEnabled.addEventListener('change', updateMode);

// ==========================================
// 11. URL PROBE & STREAM INSPECTION
// ==========================================

function setProbeBtnState(state, label = null) {
  if (!probeBtn) return;
  probeBtn.setAttribute('data-state', state);
  const labelEl = probeBtn.querySelector('.btn-label');

  if (state === 'loading') {
    probeBtn.disabled = true;
    if (labelEl) labelEl.textContent = label || 'Анализ…';
  } else if (state === 'success') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Считано!';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'success') {
        setProbeBtnState('idle', 'Считать');
      }
    }, 2500);
  } else if (state === 'error') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Ошибка';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'error') {
        setProbeBtnState('idle', 'Считать');
      }
    }, 2500);
  } else if (state === 'empty') {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Вставьте URL';
    setTimeout(() => {
      if (probeBtn.getAttribute('data-state') === 'empty') {
        setProbeBtnState('idle', 'Считать');
      }
    }, 2000);
  } else {
    probeBtn.disabled = false;
    if (labelEl) labelEl.textContent = label || 'Считать';
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

  if (!url) {
    setFieldError('Пожалуйста, вставьте ссылку на ролик YouTube.');
    setProbeBtnState('empty', 'Вставьте URL');
    urlInput.focus();
    showToast('Поле ввода пустое. Вставьте ссылку на YouTube', 'error', 3000);
    return;
  }

  setProbeBtnState('loading', 'Анализ…');

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

    if (!data.ok) {
      setProbeBtnState('error', 'Ошибка');
      showToast(data.error || 'Не удалось получить данные о видео.', 'error');
      setFieldError('Ошибка считывания потока. Проверьте ссылку или прокси.');
      if (trackCard) trackCard.hidden = true;
      if (channelsSection) channelsSection.hidden = true;
      if (transferSection) transferSection.hidden = true;
      return;
    }

    currentUrl = url;
    setProbeBtnState('success', 'Считано!');

    // Populate video metadata
    if (trackThumb) trackThumb.src = data.thumbnail || '';
    if (trackTitle) trackTitle.textContent = data.title || 'Без названия';
    if (trackUploader) trackUploader.textContent = data.uploader || 'Неизвестный автор';
    if (trackDuration) trackDuration.textContent = data.duration || '';
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
          opt.textContent = `🌐 ${track.title}`;
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

    if (channelsSection) channelsSection.hidden = false;
    if (transferSection) transferSection.hidden = false;
    if (progressBlock) progressBlock.hidden = true;
    if (doneBanner) doneBanner.hidden = true;
    updateMode();

    if (trackCard) trackCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    setProbeBtnState('error', 'Сбой сети');
    showToast('Ошибка соединения с сервером: ' + e.message, 'error');
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
// 12. DOWNLOAD LIFECYCLE & SOCKET.IO PROGRESS
// ==========================================

if (downloadBtn) downloadBtn.addEventListener('click', startDownload);

async function startDownload() {
  const vOn = videoEnabled ? videoEnabled.checked : true;
  const aOn = audioEnabled ? audioEnabled.checked : true;
  if (!vOn && !aOn) return;

  let mode;
  if (vOn && aOn) mode = 'both';
  else if (vOn) mode = 'video';
  else mode = 'audio';

  const payload = {
    url: currentUrl,
    mode,
    video_format_id: videoSelect ? videoSelect.value : '',
    audio_format_id: audioSelect ? audioSelect.value : '',
    container: selectedContainer,
    audio_codec: selectedAudioFormat,
    out_dir: (settingsDefaultDirInput?.value || destInput?.value || '').trim(),
    proxy: proxyInput ? proxyInput.value.trim() : '',
  };

  downloadBtn.disabled = true;
  if (doneBanner) doneBanner.hidden = true;
  if (progressBlock) progressBlock.hidden = false;
  if (ledFill) ledFill.style.width = '0%';
  if (progressStatus) progressStatus.textContent = 'Подготовка потока…';
  if (progressStats) progressStats.textContent = '';

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
    showToast(e.message, 'error');
    if (downloadBtn) downloadBtn.disabled = false;
    if (progressBlock) progressBlock.hidden = true;
  }
}

// Socket.IO Progress Listener
socket.on('progress', (data) => {
  if (!currentJobId || data.job_id !== currentJobId) return;

  if (data.status === 'downloading') {
    const pct = Math.min(100, Math.max(0, data.percent || 0));
    if (ledFill) ledFill.style.width = `${pct}%`;
    if (progressStatus) progressStatus.textContent = `Скачиваем (${Math.round(pct)}%)`;
    if (progressStats) progressStats.textContent = `${data.downloaded || '—'} / ${data.total || '—'} · ${data.speed || ''}`;
  } else if (data.status === 'merging') {
    if (ledFill) ledFill.style.width = '99%';
    if (progressStatus) progressStatus.textContent = 'Склейка и оптимизация через FFmpeg…';
    if (progressStats) progressStats.textContent = '';
  } else if (data.status === 'done') {
    if (ledFill) ledFill.style.width = '100%';
    if (progressStatus) progressStatus.textContent = 'Готово';
    if (progressStats) progressStats.textContent = '';
    if (doneBanner) doneBanner.hidden = false;
    lastDownloadedFilename = data.filename || 'video.mp4';
    if (doneFilename) doneFilename.textContent = lastDownloadedFilename;
    if (data.folder) {
      updateAllDirInputs(data.folder);
    }
    if (downloadBtn) downloadBtn.disabled = false;
    showToast('Загрузка успешно завершена!', 'success', 3500);
  } else if (data.status === 'error') {
    showToast('Ошибка загрузки: ' + data.error, 'error');
    if (progressBlock) progressBlock.hidden = true;
    if (downloadBtn) downloadBtn.disabled = false;
  }
});

// ==========================================
// 13. INITIALIZATION CALLS
// ==========================================

// Initialize Theme & Monet
applyThemeMode(currentThemeMode);
initMonetSwatches();

// Initialize Custom Styled Dropdowns for all select elements
if (videoSelect) setupCustomDropdown(videoSelect);
if (audioSelect) setupCustomDropdown(audioSelect);
if (audioTrackSelect) setupCustomDropdown(audioTrackSelect);

updateMode();
handleUrlInputChange();
