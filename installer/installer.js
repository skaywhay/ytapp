// Installer client controller
const targetPathInput = document.getElementById('target-path');
const browseBtn = document.getElementById('browse-btn');
const optDesktop = document.getElementById('opt-desktop');
const optStartmenu = document.getElementById('opt-startmenu');
const optRegister = document.getElementById('opt-register');
const optLaunch = document.getElementById('opt-launch');

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
    cancelBtn.hidden = true;
    installBtn.hidden = true;
    finishBtn.hidden = false;
  } else {
    alert('Ошибка при установке: ' + (errorMsg || 'Неизвестная ошибка'));
    showStep(stepOptions);
    cancelBtn.disabled = false;
    installBtn.disabled = false;
  }
};

window.addEventListener('pywebviewready', async () => {
  try {
    const defaultPath = await window.pywebview.api.get_default_target_dir();
    if (defaultPath && targetPathInput) {
      targetPathInput.value = defaultPath;
    }
  } catch (err) {
    console.error('Failed to get default path:', err);
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
