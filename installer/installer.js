// Installer client controller
const targetPathInput = document.getElementById('target-path');
const browseBtn = document.getElementById('browse-btn');
const optFfmpeg = document.getElementById('opt-ffmpeg');
const optDesktop = document.getElementById('opt-desktop');
const optStartmenu = document.getElementById('opt-startmenu');
const optRegister = document.getElementById('opt-register');
const optLaunch = document.getElementById('opt-launch');

const existingInstallBanner = document.getElementById('existing-install-banner');
const existingBannerDesc = document.getElementById('existing-banner-desc');
const stepOptionsTitle = document.getElementById('step-options-title');
const stepOptionsDesc = document.getElementById('step-options-desc');
const installBtnText = document.getElementById('install-btn-text');

let isReinstall = false;

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
    if (isReinstall) {
      const finishTitle = document.querySelector('#step-finished h2');
      if (finishTitle) finishTitle.textContent = 'Переустановка завершена!';
      const finishDesc = document.querySelector('#step-finished .step-desc');
      if (finishDesc) finishDesc.textContent = 'Приложение YT Deck успешно обновлено и готово к работе.';
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
    alert('Ошибка при установке: ' + (errorMsg || 'Неизвестная ошибка'));
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

    if (existing && existing.found) {
      isReinstall = true;
      if (targetPathInput) targetPathInput.value = existing.path || defaultPath;
      if (existingInstallBanner) {
        existingInstallBanner.hidden = false;
        existingInstallBanner.style.display = 'flex';
      }
      if (existingBannerDesc && existing.path) {
        existingBannerDesc.textContent = `Обнаружена установленная копия (версия ${existing.version || '2.5.2'}) в папке: ${existing.path}. Нажмите «Переустановить» для обновления файлов.`;
      }
      if (stepOptionsTitle) stepOptionsTitle.textContent = 'Переустановка или обновление';
      if (stepOptionsDesc) stepOptionsDesc.textContent = 'Приложение уже установлено в системе. Вы можете выполнить обновление или чистую переустановку.';
      if (installBtnText) installBtnText.textContent = 'Переустановить';
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
      alert('Пожалуйста, укажите папку для установки.');
      return;
    }

    showStep(stepProgress);
    cancelBtn.disabled = true;
    installBtn.disabled = true;

    try {
      await window.pywebview.api.start_install({
        target_dir: targetDir,
        install_ffmpeg: optFfmpeg ? optFfmpeg.checked : true,
        create_desktop_shortcut: optDesktop.checked,
        create_start_menu_shortcut: optStartmenu.checked,
        register_app: optRegister.checked,
      });
    } catch (err) {
      alert('Ошибка запуска установки: ' + err.message);
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
