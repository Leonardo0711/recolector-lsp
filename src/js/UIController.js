export class UIController {
    constructor() {
        // Inputs
        this.perfilInput = document.getElementById('perfilInput');
        this.palabraInput = document.getElementById('palabraInput');

        // Desktop Buttons
        this.btnStartCamera = document.getElementById('btnStartCamera');
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');

        // Mobile Buttons (floating overlay)
        this.btnStartCameraMobile = document.getElementById('btnStartCameraMobile');
        this.btnRecordMobile = document.getElementById('btnRecordMobile');
        this.btnStopMobile = document.getElementById('btnStopMobile');

        // Status UI (Desktop)
        this.uploadStatusUI = document.getElementById('uploadStatusUI');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');

        // Status UI (Mobile)
        this.uploadStatusMobile = document.getElementById('uploadStatusMobile');
        this.uploadProgressBarMobile = document.getElementById('uploadProgressBarMobile');

        // Badges
        this.recordingBadge = document.getElementById('recordingBadge');
        this.palabraOverlay = document.getElementById('palabraOverlay');

        // Profile Lock
        this.btnLockPerfil = document.getElementById('btnLockPerfil');
        this.iconLockPerfil = document.getElementById('iconLockPerfil');

        // Tipo Toggle
        this.tipoToggle = document.getElementById('tipoToggle');
        this.tipoOptions = this.tipoToggle.querySelectorAll('.tipo-option');
        this.tipoSlider = this.tipoToggle.querySelector('.tipo-slider');
        this.currentTipo = 'PALABRAS';

        this.initProfileLock();
        this.initTipoToggle();
    }

    // ========== PROFILE LOCK ==========
    initProfileLock() {
        const savedPerfil = localStorage.getItem('lsp_perfil');
        if (savedPerfil) {
            this.perfilInput.value = savedPerfil;
            this.lockPerfil(true);
        }

        this.btnLockPerfil.addEventListener('click', () => {
            if (this.perfilInput.disabled) {
                this.lockPerfil(false);
            } else {
                const val = this.perfilInput.value.trim();
                if (val) {
                    localStorage.setItem('lsp_perfil', val.toUpperCase());
                    this.perfilInput.value = val.toUpperCase();
                    this.lockPerfil(true);
                } else {
                    alert('Escribe un nombre de perfil para guardarlo.');
                }
            }
        });
    }

    lockPerfil(isLocked) {
        this.perfilInput.disabled = isLocked;
        if (isLocked) {
            this.btnLockPerfil.classList.add('locked');
            this.iconLockPerfil.className = 'fa-solid fa-lock';
        } else {
            this.btnLockPerfil.classList.remove('locked');
            this.iconLockPerfil.className = 'fa-solid fa-lock-open';
            this.perfilInput.focus();
        }
    }

    // ========== TIPO TOGGLE ==========
    initTipoToggle() {
        this.tipoOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tipoOptions.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTipo = btn.dataset.tipo;

                // Slide animation
                if (this.currentTipo === 'ORACIONES') {
                    this.tipoSlider.classList.add('right');
                } else {
                    this.tipoSlider.classList.remove('right');
                }

                // Update placeholder
                if (this.currentTipo === 'PALABRAS') {
                    this.palabraInput.placeholder = 'Ej. GRACIAS';
                } else {
                    this.palabraInput.placeholder = 'Ej. BUENOS DIAS';
                }
            });
        });
    }

    // ========== INPUT VALIDATION ==========
    getInputs() {
        const perfil = this.perfilInput.value.trim().toUpperCase();
        const palabra = this.palabraInput.value.trim().toUpperCase();
        const tipo = this.currentTipo;
        return { perfil, palabra, tipo };
    }

    validateInputs() {
        const { perfil, palabra } = this.getInputs();
        if (!perfil || !palabra) {
            alert("Por favor, ingresa el Nombre del Perfil y la Palabra/Oración antes de grabar.");
            return false;
        }
        return true;
    }

    // ========== STATE TRANSITIONS ==========

    setCameraReadyState() {
        // Desktop
        this.btnStartCamera.classList.add('hidden');
        this.btnRecord.disabled = false;
        // Mobile
        this.btnStartCameraMobile.classList.add('hidden');
        this.btnRecordMobile.disabled = false;
    }

    setRecordingState() {
        // Lock perfil if not locked
        if (!this.perfilInput.disabled) {
            this.btnLockPerfil.click();
        }
        this.palabraInput.disabled = true;

        // Disable toggle
        this.tipoOptions.forEach(b => { b.disabled = true; b.style.pointerEvents = 'none'; });

        // Desktop buttons
        this.btnRecord.classList.add('hidden');
        this.btnStop.classList.remove('hidden');
        // Mobile buttons
        this.btnRecordMobile.classList.add('hidden');
        this.btnStopMobile.classList.remove('hidden');

        // Badges
        this.recordingBadge.classList.remove('hidden');
        this.uploadStatusUI.classList.add('hidden');
        this.uploadStatusMobile.classList.add('hidden');

        // Show palabra overlay on video
        const { palabra, tipo } = this.getInputs();
        const tipoLabel = tipo === 'PALABRAS' ? '🔤' : '💬';
        this.palabraOverlay.textContent = `${tipoLabel} ${palabra}`;
        this.palabraOverlay.classList.remove('hidden');
    }

    setUploadingState() {
        // Desktop
        this.btnStop.disabled = true;
        // Mobile
        this.btnStopMobile.disabled = true;

        this.recordingBadge.classList.add('hidden');

        // Desktop upload UI
        this.uploadStatusUI.classList.remove('hidden');
        this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Empaquetando y subiendo...';
        this.setProgressBar(50);

        // Mobile upload UI
        this.uploadStatusMobile.classList.remove('hidden');
        this.uploadStatusMobile.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
        this.setProgressBarMobile(50);
    }

    setFinishedState() {
        // Restore desktop buttons
        this.btnStop.classList.add('hidden');
        this.btnStop.disabled = false;
        this.btnRecord.classList.remove('hidden');
        // Restore mobile buttons
        this.btnStopMobile.classList.add('hidden');
        this.btnStopMobile.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');

        // Unlock palabra
        this.palabraInput.disabled = false;
        this.palabraInput.value = '';
        this.palabraInput.focus();

        // Re-enable toggle
        this.tipoOptions.forEach(b => { b.disabled = false; b.style.pointerEvents = ''; });

        // Hide palabra overlay
        this.palabraOverlay.classList.add('hidden');

        // Desktop
        this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado en Drive!';
        this.setProgressBar(100);
        // Mobile
        this.uploadStatusMobile.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado!';
        this.setProgressBarMobile(100);

        setTimeout(() => {
            if (!this.recordingBadge.classList.contains('hidden')) return;
            this.uploadStatusUI.classList.add('hidden');
            this.uploadStatusMobile.classList.add('hidden');
            this.setProgressBar(0);
            this.setProgressBarMobile(0);
        }, 4000);
    }

    setErrorState(message) {
        // Desktop
        this.btnStop.classList.add('hidden');
        this.btnStop.disabled = false;
        this.btnRecord.classList.remove('hidden');
        // Mobile
        this.btnStopMobile.classList.add('hidden');
        this.btnStopMobile.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');

        this.palabraInput.disabled = false;
        this.palabraOverlay.classList.add('hidden');

        // Re-enable toggle
        this.tipoOptions.forEach(b => { b.disabled = false; b.style.pointerEvents = ''; });

        // Desktop error
        this.uploadStatusUI.classList.remove('hidden');
        this.uploadStatusUI.querySelector('.status-text').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error: ${message}`;
        this.uploadStatusUI.style.background = 'rgba(255, 71, 87, 0.1)';
        this.uploadStatusUI.style.borderColor = 'rgba(255, 71, 87, 0.3)';
        this.setProgressBar(0);

        // Mobile error
        this.uploadStatusMobile.classList.remove('hidden');
        this.uploadStatusMobile.querySelector('.status-text').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${message}`;
        this.setProgressBarMobile(0);
    }

    setProgressBar(percentage) {
        this.uploadProgressBar.style.width = `${percentage}%`;
    }

    setProgressBarMobile(percentage) {
        this.uploadProgressBarMobile.style.width = `${percentage}%`;
    }
}
