import { CameraManager } from "./CameraManager.js";
import { RecorderManager } from "./RecorderManager.js";
import { UIController } from "./UIController.js";
import { DriveUploader } from "./DriveUploader.js";
import { ThemeController } from "./ThemeController.js";
import TourManager from "./TourManager.js";

// Initialize global theme
const themeCtrl = new ThemeController();

document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Elements ---
    const landing = document.getElementById('landing');
    const appContainer = document.getElementById('appContainer');
    const btnParticipar = document.getElementById('btnParticipar');
    const btnBackToLanding = document.getElementById('btnBackToLanding');
    const btnStartTour = document.getElementById('btnStartTour');

    if (btnParticipar && landing && appContainer) {
        btnParticipar.addEventListener('click', () => {
            landing.classList.add('fade-out');
            setTimeout(() => {
                landing.classList.add('hidden');
                appContainer.classList.remove('hidden', 'fade-in');
                appContainer.classList.add('fade-in');
                setTimeout(() => TourManager.startTourAuto(), 400);
            }, 350);
        });
    }

    if (btnBackToLanding && appContainer && landing) {
        btnBackToLanding.addEventListener('click', () => {
            appContainer.classList.remove('fade-in');
            appContainer.classList.add('hidden');
            landing.classList.remove('hidden', 'fade-out');
        });
    }

    if (btnStartTour) {
        btnStartTour.addEventListener('click', () => TourManager.startTour());
    }

    window.appInstance = new App();
});


class App {
    constructor() {
        this.ui = new UIController();
        this.camera = new CameraManager("webcam");
        this.uploader = new DriveUploader();
        this.recorder = null;
        
        this.currentRecording = null;
        this.sessionId = this.generateSessionId();
        this.participantId = this.getOrCreateParticipantId();

        this.init();
    }

    async init() {
        await this.ui.loadVocab();
        this.initEventListeners();
    }

    /**
     * Generates a persistent UUID for the participant.
     */
    getOrCreateParticipantId() {
        let id = localStorage.getItem('lsp_participant_uuid');
        if (!id) {
            id = crypto.randomUUID ? crypto.randomUUID() : `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('lsp_participant_uuid', id);
        }
        return id;
    }

    generateSessionId() {
        const d = new Date();
        const datePart = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
        const timePart = `${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}`;
        return `S-${datePart}-${timePart}`;
    }

    initEventListeners() {
        // 1. Camera Initialization
        const startCamera = async () => {
            try {
                this.ui.btnStartCamera.disabled = true;
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
                
                await this.camera.startCamera();
                this.recorder = new RecorderManager(this.camera.getStream());
                this.ui.setCameraReadyState();
            } catch (error) {
                alert("Error cámara: " + error.message);
                this.ui.btnStartCamera.disabled = false;
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
            }
        };
        
        if (this.ui.btnStartCamera) {
            this.ui.btnStartCamera.addEventListener('click', startCamera);
        }

        // 2. Recording Flow (Toggle Pattern)
        const toggleRecording = async () => {
            // If not recording -> Start countdown then record
            if (this.ui.recordingBadge.classList.contains('hidden')) {
                if (!this.ui.participantData) return alert("Primero confirma tus datos de participante.");
                if (!this.ui.currentWord) return alert("Selecciona un ítem para grabar.");
                
                // Block UI during countdown
                this.ui.btnRecord.disabled = true;
                this.ui.btnRecordMobile.disabled = true;

                await this.ui.startCountdown();

                this.ui.setRecordingState();
                this.recorder.startRecording();
            } 
            // If recording -> Stop
            else {
                const data = await this.recorder.stopRecording();
                this.currentRecording = data;
                this.ui.showPreview(data.videoBlob, {
                    width: data.width,
                    height: data.height,
                    duration: data.duration
                });
            }
        };

        if (this.ui.btnRecord) this.ui.btnRecord.addEventListener('click', toggleRecording);
        if (this.ui.btnStop) this.ui.btnStop.addEventListener('click', toggleRecording);
        if (this.ui.btnRecordMobile) this.ui.btnRecordMobile.addEventListener('click', toggleRecording);

        // 3. Review & Upload Flow
        if (this.ui.btnAccept) {
            this.ui.btnAccept.addEventListener('click', async () => {
                try {
                    this.ui.setUploadingState();
                    
                    const meta = this.ui.getMetadata();
                    const payload = {
                        ...meta, // All UI metadata (capture_mode, IDs, labels, flags, etc.)
                        session_id: this.sessionId,
                        participant_id: this.participantId,
                        alias: meta.participant.alias,
                        capture_datetime: new Date().toISOString(),
                        width: this.currentRecording.width,
                        height: this.currentRecording.height,
                        duration_sec: parseFloat(this.currentRecording.duration.toFixed(2)),
                        device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
                    };

                    const response = await this.uploader.uploadData(this.currentRecording.videoBlob, payload);
                    console.log("Subida exitosa:", response.sample_id);
                    
                    this.ui.setFinishedState();
                    this.currentRecording = null;
                } catch (error) {
                    this.ui.setErrorState(error.message);
                }
            });
        }
    }
}

