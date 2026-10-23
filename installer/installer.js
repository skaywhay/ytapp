// Installer client controller
const targetPathInput = document.getElementById('target-path');
const targetPathLabel = document.getElementById('target-path-label');
const targetPathHint = document.getElementById('target-path-hint');
const browseBtn = document.getElementById('browse-btn');
const optFfmpeg = document.getElementById('opt-ffmpeg');
const optFfmpegText = document.getElementById('opt-ffmpeg-text');
const optDesktop = document.getElementById('opt-desktop');
const optDesktopText = document.getElementById('opt-desktop-text');
const optStartmenu = document.getElementById('opt-startmenu');
const optStartmenuText = document.getElementById('opt-startmenu-text');
const optRegister = document.getElementById('opt-register');
const optRegisterText = document.getElementById('opt-register-text');
const optLaunch = document.getElementById('opt-launch');
const optLaunchText = document.getElementById('opt-launch-text');

const brandVersionLabel = document.getElementById('brand-version-label');
const existingInstallBanner = document.getElementById('existing-install-banner');
const existingBannerTitle = document.getElementById('existing-banner-title');
const existingBannerDesc = document.getElementById('existing-banner-desc');
const stepOptionsTitle = document.getElementById('step-options-title');
const stepOptionsDesc = document.getElementById('step-options-desc');
const stepProgressTitle = document.getElementById('step-progress-title');
const stepProgressDesc = document.getElementById('step-progress-desc');
const stepFinishedTitle = document.getElementById('step-finished-title');
const stepFinishedDesc = document.getElementById('step-finished-desc');
const installBtnText = document.getElementById('install-btn-text');

let isUpdate = false;
let targetVersion = '2.5.3';

const stepOptions = document.getElementById('step-options');
const stepProgress = document.getElementById('step-progress');
const stepFinished = document.getElementById('step-finished');

const progressBarFill = document.getElementById('progress-bar-fill');
const progressStatusText = document.getElementById('progress-status-text');
const progressPercentText = document.getElementById('progress-percent-text');

const cancelBtn = document.getElementById('cancel-btn');
const installBtn = document.getElementById('install-btn');
const finishBtn = document.getElementById('finish-btn');

function showStep(stepEl) {
  [stepOptions, stepProgress, stepFinished].forEach((s) => s.classList.remove('active'));
  stepEl.classList.add('active');
}

// Global hook called by Python to update installation progress
window.updateInstallerProgress = function(percent, statusMessage) {
  if (progressBarFill) progressBarFill.style.width = `${percent}%`;
  if (progressPercentText) progressPercentText.textContent = `${Math.round(percent)}%`;
  if (progressStatusText) progressStatusText.textContent = statusMessage;
};

// Global hook called by Python when installation is complete
window.onInstallationFinished = function(success, errorMsg) {
  if (success) {
    showStep(stepFinished);
    if (isUpdate) {
      if (stepFinishedTitle) stepFinishedTitle.textContent = 'Обновление завершено!';
      if (stepFinishedDesc) stepFinishedDesc.textContent = `Приложение YT Deck успешно обновлено до версии ${targetVersion} и готово к работе.`;
      if (optLaunchText) optLaunchText.textContent = 'Запустить обновлённый YT Deck прямо сейчас';
    }
    if (cancelBtn) {
      cancelBtn.hidden = true;
      cancelBtn.style.display = 'none';
    }
    if (installBtn) {
      installBtn.hidden = true;
      installBtn.style.display = 'none';
    }
    if (finishBtn) {
      finishBtn.hidden = false;
      finishBtn.style.display = 'inline-flex';
    }
  } else {
    alert((isUpdate ? 'Ошибка при обновлении: ' : 'Ошибка при установке: ') + (errorMsg || 'Неизвестная ошибка'));
    showStep(stepOptions);
    if (cancelBtn) {
      cancelBtn.disabled = false;
      cancelBtn.style.display = 'inline-flex';
    }
    if (installBtn) {
      installBtn.disabled = false;
      installBtn.style.display = 'inline-flex';
    }
    if (finishBtn) {
      finishBtn.hidden = true;
      finishBtn.style.display = 'none';
    }
  }
};

window.addEventListener('pywebviewready', async () => {
  try {
    const existing = await window.pywebview.api.check_existing();
    const defaultPath = await window.pywebview.api.get_default_target_dir();

    if (existing && (existing.found || existing.is_update)) {
      isUpdate = true;
      targetVersion = existing.installer_version || '2.5.2';
      const installedVer = existing.installed_version || existing.version;

      document.title = 'Обновление YT Deck';
      if (brandVersionLabel) {
        brandVersionLabel.textContent = `Версия ${targetVersion} (обновление)`;
      }

      if (targetPathInput) targetPathInput.value = existing.path || defaultPath;
      if (targetPathLabel) targetPathLabel.textContent = 'Папка с установленным приложением';
      if (targetPathHint) {
        targetPathHint.textContent = 'Обновление будет установлено в текущую рабочую директорию программы.';
      }

      if (existingInstallBanner) {
        existingInstallBanner.hidden = false;
        existingInstallBanner.style.display = 'flex';
      }
      if (existingBannerTitle) {
        existingBannerTitle.textContent = 'Доступно обновление YT Deck';
      }
      if (existingBannerDesc && existing.path) {
        const currentVerStr = installedVer ? `версия ${installedVer}` : 'предыдущая версия';
        existingBannerDesc.textContent = `Обнаружена установленная ${currentVerStr} в папке: ${existing.path}. Нажмите «Обновить» для быстрой установки версии ${targetVersion}. Все ваши настройки, загрузки и история будут полностью сохранены.`;
      }

      if (stepOptionsTitle) stepOptionsTitle.textContent = 'Обновление приложения';
      if (stepOptionsDesc) {
        stepOptionsDesc.textContent = 'Обновление компонентов YT Deck до актуальной версии с сохранением всех данных.';
      }
      if (installBtnText) installBtnText.textContent = 'Обновить';

      if (optFfmpegText) {
        optFfmpegText.textContent = 'Обновить медиаконвертер FFmpeg (для склейки видео 1080p, 4K и звука)';
      }
      if (optDesktopText) {
        optDesktopText.textContent = 'Обновить ярлык на рабочем столе';
      }
      if (optStartmenuText) {
        optStartmenuText.textContent = 'Обновить ярлык в меню «Пуск» Windows';
      }
      if (optRegisterText) {
        optRegisterText.textContent = 'Обновить регистрацию в системе Windows';
      }
    } else {
      if (defaultPath && targetPathInput) {
        targetPathInput.value = defaultPath;
      }
    }
  } catch (err) {
    console.error('Failed to initialize installer data:', err);
  }
});

if (browseBtn) {
  browseBtn.addEventListener('click', async () => {
    try {
      const selected = await window.pywebview.api.pick_folder(targetPathInput.value);
      if (selected && targetPathInput) {
        targetPathInput.value = selected;
      }
    } catch (err) {
      console.error('Folder pick error:', err);
    }
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', async () => {
    try {
      await window.pywebview.api.close();
    } catch (_) {
      window.close();
    }
  });
}

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    const targetDir = (targetPathInput?.value || '').trim();
    if (!targetDir) {
      alert(isUpdate ? 'Пожалуйста, укажите папку для обновления.' : 'Пожалуйста, укажите папку для установки.');
      return;
    }

    if (isUpdate) {
      if (stepProgressTitle) stepProgressTitle.textContent = 'Идёт обновление...';
      if (stepProgressDesc) {
        stepProgressDesc.textContent = 'Пожалуйста, подождите, пока компоненты обновляются до актуальной версии.';
      }
    }

    showStep(stepProgress);
    cancelBtn.disabled = true;
    installBtn.disabled = true;

    try {
      await window.pywebview.api.start_install({
        target_dir: targetDir,
        install_ffmpeg: optFfmpeg ? optFfmpeg.checked : true,
        create_desktop_shortcut: optDesktop ? optDesktop.checked : true,
        create_start_menu_shortcut: optStartmenu ? optStartmenu.checked : true,
        register_app: optRegister ? optRegister.checked : true,
        is_update: isUpdate,
      });
    } catch (err) {
      alert((isUpdate ? 'Ошибка запуска обновления: ' : 'Ошибка запуска установки: ') + err.message);
      showStep(stepOptions);
      cancelBtn.disabled = false;
      installBtn.disabled = false;
    }
  });
}

if (finishBtn) {
  finishBtn.addEventListener('click', async () => {
    try {
      await window.pywebview.api.finish_and_launch(optLaunch.checked);
    } catch (_) {
      window.close();
    }
  });
}
