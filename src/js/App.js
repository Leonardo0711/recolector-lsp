import { CameraManager } from "./CameraManager.js";
import { RecorderManager } from "./RecorderManager.js";
import { UIController } from "./UIController.js";
import { DriveUploader } from "./DriveUploader.js";

// Page transition elements
const landing = document.getElementById('landing');
const appContainer = document.getElementById('appContainer');
const btnParticipar = document.getElementById('btnParticipar');
const btnBackToLanding = document.getElementById('btnBackToLanding');

// Landing → App transition
btnParticipar.addEventListener('click', () => {
    landing.classList.add('fade-out');
    setTimeout(() => {
        landing.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('fade-in');
    }, 350);
});

// App → Landing transition (back button)
btnBackToLanding.addEventListener('click', () => {
    appContainer.classList.remove('fade-in');
    appContainer.classList.add('hidden');
    landing.classList.remove('hidden', 'fade-out');
});

class App {
    constructor() {
        this.ui = new UIController();
        this.camera = new CameraManager("webcam");
        this.uploader = new DriveUploader();
        this.recorder = null;

        this.initEventListeners();
    }

    initEventListeners() {
        // --- Iniciar Cámara (Desktop + Mobile) ---
        const startCameraHandler = async () => {
            try {
                // Disable both buttons
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
                this.ui.btnStartCamera.disabled = true;
                this.ui.btnStartCameraMobile.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                this.ui.btnStartCameraMobile.disabled = true;

                await this.camera.startCamera();
                this.recorder = new RecorderManager(this.camera.getStream());

                this.ui.setCameraReadyState();
            } catch (error) {
                alert(error.message);
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
                this.ui.btnStartCamera.disabled = false;
                this.ui.btnStartCameraMobile.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
                this.ui.btnStartCameraMobile.disabled = false;
            }
        };
        this.ui.btnStartCamera.addEventListener('click', startCameraHandler);
        this.ui.btnStartCameraMobile.addEventListener('click', startCameraHandler);

        // --- Grabar (Desktop + Mobile) ---
        const recordHandler = () => {
            if (!this.ui.validateInputs()) return;
            if (!this.recorder) return;

            this.ui.setRecordingState();
            this.recorder.startRecording();
        };
        this.ui.btnRecord.addEventListener('click', recordHandler);
        this.ui.btnRecordMobile.addEventListener('click', recordHandler);

        // --- Detener y Subir (Desktop + Mobile) ---
        const stopHandler = async () => {
            try {
                this.ui.setUploadingState();

                const { videoBlob } = await this.recorder.stopRecording();
                const { perfil, palabra, tipo } = this.ui.getInputs();

                await this.uploader.uploadData(videoBlob, perfil, palabra, tipo);

                this.ui.setFinishedState();

            } catch (e) {
                console.error(e);
                this.ui.setErrorState(e.message || "Error al subir video");
            }
        };
        this.ui.btnStop.addEventListener('click', stopHandler);
        this.ui.btnStopMobile.addEventListener('click', stopHandler);
    }
}

// Iniciar app al cargar
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
