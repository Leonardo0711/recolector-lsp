import { CameraManager } from "./CameraManager.js";
import { RecorderManager } from "./RecorderManager.js";
import { UIController } from "./UIController.js";
import { DriveUploader } from "./DriveUploader.js";
import { ThemeController } from "./ThemeController.js";
import TourManager from "./TourManager.js";

// Initialize global theme
const themeCtrl = new ThemeController();

// --- Navigation Elements ---
const landing = document.getElementById('landing');
const appContainer = document.getElementById('appContainer');
const btnParticipar = document.getElementById('btnParticipar');
const btnBackToLanding = document.getElementById('btnBackToLanding');
const btnStartTour = document.getElementById('btnStartTour');

btnParticipar.addEventListener('click', () => {
    landing.classList.add('fade-out');
    setTimeout(() => {
        landing.classList.add('hidden');
        appContainer.classList.remove('hidden', 'fade-in');
        appContainer.classList.add('fade-in');
        setTimeout(() => TourManager.startTourAuto(), 400);
    }, 350);
});

btnBackToLanding.addEventListener('click', () => {
    appContainer.classList.remove('fade-in');
    appContainer.classList.add('hidden');
    landing.classList.remove('hidden', 'fade-out');
});

btnStartTour.addEventListener('click', () => TourManager.startTour());

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
        this.ui.btnStartCamera.addEventListener('click', startCamera);

        // 2. Recording Flow (Toggle Pattern)
        const toggleRecording = async () => {
            // If not recording -> Start
            if (this.ui.recordingBadge.classList.contains('hidden')) {
                if (!this.ui.participantData) return alert("Primero confirma tus datos de participante.");
                if (!this.ui.currentWord) return alert("Selecciona una palabra para grabar.");
                
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

        this.ui.btnRecord.addEventListener('click', toggleRecording);
        this.ui.btnStop.addEventListener('click', toggleRecording);
        this.ui.btnRecordMobile.addEventListener('click', toggleRecording);

        // 3. Review & Upload Flow
        this.ui.btnAccept.addEventListener('click', async () => {
            try {
                this.ui.setUploadingState();
                
                const meta = this.ui.getMetadata();
                const payload = {
                    participant_id: this.participantId,
                    alias: meta.participant.alias,
                    session_id: this.sessionId,
                    label_id: meta.word.label_id,
                    label: meta.word.label,
                    repetition: meta.repetition,
                    capture_datetime: new Date().toISOString(),
                    width: this.currentRecording.width,
                    height: this.currentRecording.height,
                    duration_sec: parseFloat(this.currentRecording.duration.toFixed(2)),
                    device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
                    age: meta.participant.age,
                    region: meta.participant.region,
                    dominant_hand: meta.participant.hand,
                    lsp_level: meta.participant.level,
                    participant_type: meta.participant.type,
                    consent_research: meta.consent_research,
                    consent_training: meta.consent_training,
                    consent_storage: meta.consent_storage,
                    quality_status: "pending",
                    review_status: "pending",
                    processing_status: "raw"
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

document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
