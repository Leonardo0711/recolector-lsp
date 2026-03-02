export class UIController {
    constructor() {
        // Inputs
        this.perfilInput = document.getElementById('perfilInput');
        this.palabraInput = document.getElementById('palabraInput');

        // Botones
        this.btnStartCamera = document.getElementById('btnStartCamera');
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');

        // Status UI
        this.uploadStatusUI = document.getElementById('uploadStatusUI');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');

        // Badges
        this.recordingBadge = document.getElementById('recordingBadge');

        // Profile Lock
        this.btnLockPerfil = document.getElementById('btnLockPerfil');
        this.iconLockPerfil = document.getElementById('iconLockPerfil');

        this.initProfileLock();
    }

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
            this.btnLockPerfil.classList.replace('btn-primary', 'btn-stop');
            this.iconLockPerfil.className = 'fa-solid fa-lock';
        } else {
            this.btnLockPerfil.classList.replace('btn-stop', 'btn-primary');
            this.iconLockPerfil.className = 'fa-solid fa-pen';
            this.perfilInput.focus();
        }
    }

    // --- Inputs Validation ---

    getInputs() {
        // Limpiamos los valores y forzamos mayúsculas
        const perfil = this.perfilInput.value.trim().toUpperCase();
        const palabra = this.palabraInput.value.trim().toUpperCase();
        return { perfil, palabra };
    }

    validateInputs() {
        const { perfil, palabra } = this.getInputs();
        if (!perfil || !palabra) {
            alert("Por favor, ingresa el Nombre del Perfil y la Palabra antes de grabar.");
            return false;
        }
        return true;
    }

    // --- State Transitions ---

    setCameraReadyState() {
        this.btnStartCamera.classList.add('hidden');
        this.btnRecord.disabled = false;
    }

    setRecordingState() {
        // Asegurar que el perfil esté bloqueado al grabar
        if (!this.perfilInput.disabled) {
            this.btnLockPerfil.click();
        }

        // Bloquear inputs
        this.palabraInput.disabled = true;

        // Botones
        this.btnRecord.classList.add('hidden');
        this.btnStop.classList.remove('hidden');

        // UI Badges
        this.recordingBadge.classList.remove('hidden');
        this.uploadStatusUI.classList.add('hidden');
    }

    setUploadingState() {
        this.btnStop.disabled = true;
        this.recordingBadge.classList.add('hidden');

        this.uploadStatusUI.classList.remove('hidden');
        this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Empaquetando y subiendo...';
        this.setProgressBar(50);
    }

    setFinishedState() {
        // Restaurar estado inicial
        this.btnStop.classList.add('hidden');
        this.btnStop.disabled = false;
        this.btnRecord.classList.remove('hidden');

        // Desbloquear input palabra para la siguiente
        this.palabraInput.disabled = false;
        this.palabraInput.value = ''; // Limpiar palabra anterior
        this.palabraInput.focus();

        this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado en Drive!';
        this.setProgressBar(100);

        setTimeout(() => {
            if (!this.recordingBadge.classList.contains('hidden')) return; // if started recording again
            this.uploadStatusUI.classList.add('hidden');
            this.setProgressBar(0);
        }, 4000);
    }

    setErrorState(message) {
        this.btnStop.classList.add('hidden');
        this.btnStop.disabled = false;
        this.btnRecord.classList.remove('hidden');

        this.palabraInput.disabled = false;

        this.uploadStatusUI.classList.remove('hidden');
        this.uploadStatusUI.querySelector('.status-text').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error: ${message}`;
        this.uploadStatusUI.style.background = 'rgba(239, 68, 68, 0.1)';
        this.uploadStatusUI.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        this.uploadStatusUI.style.color = 'var(--record)';
        this.setProgressBar(0);
    }

    setProgressBar(percentage) {
        this.uploadProgressBar.style.width = `${percentage}%`;
    }

    // --- Config Modal Removed ---
}
