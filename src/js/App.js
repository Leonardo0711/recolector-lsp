import { CameraManager } from "./CameraManager.js";
import { RecorderManager } from "./RecorderManager.js";
import { UIController } from "./UIController.js";
import { DriveUploader } from "./DriveUploader.js";

class App {
    constructor() {
        this.ui = new UIController();
        this.camera = new CameraManager("webcam");
        this.uploader = new DriveUploader();
        this.recorder = null;

        this.initEventListeners();
    }

    checkInitialConfig() {
        // Ya no es necesario, URL está hardcodeada
    }

    initEventListeners() {
        // Modal Removed

        // Iniciar Cámara
        this.ui.btnStartCamera.addEventListener('click', async () => {
            try {
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
                this.ui.btnStartCamera.disabled = true;

                // Prender Camara
                await this.camera.startCamera();

                // Instanciar Grabador Maestro
                this.recorder = new RecorderManager(this.camera.getStream());

                this.ui.setCameraReadyState();
            } catch (error) {
                alert(error.message);
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
                this.ui.btnStartCamera.disabled = false;
            }
        });

        // Grabar
        this.ui.btnRecord.addEventListener('click', () => {
            if (!this.ui.validateInputs()) return;
            if (!this.recorder) return;

            // URL está hardcodeada siempre tendrá returns true

            this.ui.setRecordingState();
            this.recorder.startRecording();
        });

        // Detener y Subir
        this.ui.btnStop.addEventListener('click', async () => {
            try {
                this.ui.setUploadingState();

                // 1. Detener Grabación y sacar datos
                const { videoBlob } = await this.recorder.stopRecording();
                const { perfil, palabra } = this.ui.getInputs();

                // 2. Subir a Drive Serverless ArrayBuffer
                await this.uploader.uploadData(videoBlob, perfil, palabra);

                // 3. Todo OK
                this.ui.setFinishedState();

            } catch (e) {
                console.error(e);
                this.ui.setErrorState(e.message || "Error al subir video");
            }
        });
    }
}

// Iniciar app al cargar
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
