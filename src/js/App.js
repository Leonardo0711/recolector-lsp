import { CameraManager } from "./CameraManager.js";
import { RecorderManager } from "./RecorderManager.js";
import { UIController } from "./UIController.js";
import { DriveUploader } from "./DriveUploader.js";
import { ThemeController } from "./ThemeController.js";
import TourManager from "./TourManager.js";
import { AdminAnnotationManager } from "./AdminAnnotationManager.js";

// Initialize global theme
const themeCtrl = new ThemeController();

document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Elements ---
    const landing = document.getElementById('landing');
    const authView = document.getElementById('authView');
    const appContainer = document.getElementById('appContainer');
    const btnParticipar = document.getElementById('btnParticipar');
    const btnLandingLogin = document.getElementById('btnLandingLogin');
    const btnStartTour = document.getElementById('btnStartTour');

    function navigateToAppOrLogin() {
        const hasSession = !!localStorage.getItem('lsp_user_session');
        if (landing) landing.classList.add('fade-out');
        setTimeout(() => {
            if (landing) {
                landing.classList.add('hidden');
                landing.classList.remove('fade-out');
            }
            if (hasSession) {
                if (authView) authView.classList.add('hidden');
                if (appContainer) {
                    appContainer.classList.remove('hidden', 'fade-in');
                    appContainer.classList.add('fade-in');
                }
                setTimeout(() => TourManager.startTourAuto(), 400);
            } else {
                if (appContainer) appContainer.classList.add('hidden');
                if (authView) {
                    authView.classList.remove('hidden', 'fade-in');
                    authView.classList.add('fade-in');
                }
                if (window.appInstance && window.appInstance.ui) {
                    window.appInstance.ui.showAuthStep('email');
                }
            }
        }, 300);
    }

    if (btnParticipar) {
        btnParticipar.addEventListener('click', navigateToAppOrLogin);
    }

    if (btnLandingLogin) {
        btnLandingLogin.addEventListener('click', navigateToAppOrLogin);
    }

    if (btnStartTour) {
        btnStartTour.addEventListener('click', () => TourManager.startTour());
    }

    // Inicializar el panel de administración/anotación
    const adminManager = new AdminAnnotationManager();
    adminManager.init();
    window.adminInstance = adminManager;

    // Función para manejar la ruta basada en hash
    function handleHashRoute() {
        const hash = window.location.hash;
        const landing = document.getElementById("landing");
        const authView = document.getElementById("authView");
        const appContainer = document.getElementById("appContainer");
        const dashboardContainer = document.getElementById("dashboardContainer");

        if (hash === "#admin" || hash === "#/admin") {
            if (landing) landing.classList.add("hidden");
            if (authView) authView.classList.add("hidden");
            if (appContainer) appContainer.classList.add("hidden");
            if (dashboardContainer) {
                dashboardContainer.classList.remove("hidden");
            }
            if (window.adminInstance) {
                window.adminInstance.open();
            }
        } else if (hash === "#login" || hash === "#/login") {
            if (dashboardContainer) dashboardContainer.classList.add("hidden");
            if (landing) landing.classList.add("hidden");
            if (appContainer) appContainer.classList.add("hidden");
            if (authView) {
                authView.classList.remove("hidden");
                if (window.appInstance && window.appInstance.ui) {
                    window.appInstance.ui.showAuthStep('email');
                }
            }
        } else {
            if (dashboardContainer) {
                dashboardContainer.classList.add("hidden");
            }
            const hasSession = !!localStorage.getItem('lsp_user_session');
            if (hasSession && appContainer && !appContainer.classList.contains('hidden')) {
                // Mantener sesión activa en el estudio
            } else if (authView && !authView.classList.contains('hidden')) {
                // Mantener pantalla de autenticación si está visible
            } else if (landing && (!appContainer || appContainer.classList.contains("hidden"))) {
                landing.classList.remove("hidden");
            }
        }
    }

    // Detectar hash al cargar e iniciar el ruteo
    handleHashRoute();

    // Escuchar cambios de hash
    window.addEventListener("hashchange", handleHashRoute);

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
        this.participantId = localStorage.getItem('lsp_participant_uuid');
        this.resumeCode = localStorage.getItem('lsp_participant_resume_code');

        this.init();
    }

    async init() {
        await this.ui.loadVocab();
        this.ui.setAuthHandlers({
            checkEmail: (email) => this.uploader.checkParticipantEmail(email),
            completeRegistration: (email, tempCode, password, profile) => this.completeRegistration(email, tempCode, password, profile),
            login: (email, password) => this.loginParticipant(email, password),
            onSessionActive: (session) => this.onSessionActive(session),
            onLogout: () => this.onLogout()
        });
        this.initEventListeners();
    }

    async completeRegistration(email, tempCode, password, profile) {
        const response = await this.uploader.completeFirstTimeRegistration(email, tempCode, password, profile);
        this.participantId = response.participant?.participant_id || response.participant_id;
        if (this.participantId) {
            localStorage.setItem('lsp_participant_uuid', this.participantId);
        }
        localStorage.setItem('lsp_user_session', JSON.stringify(response));
        return response;
    }

    async loginParticipant(email, password) {
        const response = await this.uploader.loginParticipant(email, password);
        this.participantId = response.participant?.participant_id || response.participant_id;
        if (this.participantId) {
            localStorage.setItem('lsp_participant_uuid', this.participantId);
        }
        localStorage.setItem('lsp_user_session', JSON.stringify(response));
        return response;
    }

    onSessionActive(session) {
        if (session && session.participant) {
            this.participantId = session.participant.participant_id;
            localStorage.setItem('lsp_participant_uuid', this.participantId);
            localStorage.setItem('lsp_user_session', JSON.stringify(session));
        }
    }

    onLogout() {
        this.participantId = null;
        this.resumeCode = null;
        localStorage.removeItem('lsp_participant_uuid');
        localStorage.removeItem('lsp_participant_resume_code');
        localStorage.removeItem('lsp_user_session');
        localStorage.removeItem('lsp_participant_profile');
        this.currentRecording = null;
    }

    /**
     * Generates a persistent UUID for the participant.
     */
    createParticipantId() {
        return crypto.randomUUID ? crypto.randomUUID() : `P-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }

    createResumeCode() {
        const bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        const value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
        return `LSP-${value.match(/.{1,4}/g).join('-')}`;
    }

    async registerParticipant(profile) {
        if (!this.participantId) this.participantId = this.createParticipantId();
        if (!this.resumeCode) this.resumeCode = this.createResumeCode();

        const response = await this.uploader.registerParticipant({
            participant_id: this.participantId,
            resume_code: this.resumeCode,
            alias: profile.alias,
            age: profile.age,
            region: profile.region,
            dominant_hand: profile.hand,
            lsp_level: profile.level,
            participant_type: profile.type
        });

        localStorage.setItem('lsp_participant_uuid', this.participantId);
        localStorage.setItem('lsp_participant_resume_code', this.resumeCode);
        return { ...response, participant_id: this.participantId, resume_code: this.resumeCode };
    }

    async resumeParticipant(participantId, resumeCode) {
        const response = await this.uploader.resumeParticipant(participantId, resumeCode);
        this.participantId = participantId;
        this.resumeCode = resumeCode;
        localStorage.setItem('lsp_participant_uuid', participantId);
        localStorage.setItem('lsp_participant_resume_code', resumeCode);
        return response;
    }

    generateSessionId() {
        const d = new Date();
        const datePart = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
        const timePart = `${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}`;
        return `S-${datePart}-${timePart}`;
    }

    initEventListeners() {
        const startCamera = async () => {
            try {
                this.ui.btnStartCamera.disabled = true;
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
                if (this.ui.btnStartCameraMobile) {
                    this.ui.btnStartCameraMobile.disabled = true;
                    this.ui.btnStartCameraMobile.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
                }
                
                await this.camera.startCamera();
                this.recorder = new RecorderManager(this.camera.getStream());
                this.ui.setCameraReadyState();
            } catch (error) {
                alert("Error cámara: " + error.message);
                this.ui.btnStartCamera.disabled = false;
                this.ui.btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
                if (this.ui.btnStartCameraMobile) {
                    this.ui.btnStartCameraMobile.disabled = false;
                    this.ui.btnStartCameraMobile.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
                }
            }
        };
        
        if (this.ui.btnStartCamera) {
            this.ui.btnStartCamera.addEventListener('click', startCamera);
        }
        if (this.ui.btnStartCameraMobile) {
            this.ui.btnStartCameraMobile.addEventListener('click', startCamera);
        }
        if (this.ui.btnSwitchCamera) {
            this.ui.btnSwitchCamera.addEventListener('click', async () => {
                try {
                    this.ui.btnSwitchCamera.disabled = true;
                    const icon = this.ui.btnSwitchCamera.querySelector('i');
                    if (icon) icon.classList.add('fa-spin');
                    
                    await this.camera.switchCamera();
                    // Re-instantiate recorder with the new stream
                    this.recorder = new RecorderManager(this.camera.getStream());
                } catch (error) {
                    alert("Error al cambiar de cámara: " + error.message);
                } finally {
                    this.ui.btnSwitchCamera.disabled = false;
                    const icon = this.ui.btnSwitchCamera.querySelector('i');
                    if (icon) icon.classList.remove('fa-spin');
                }
            });
        }

        // 2. Recording Flow (Toggle Pattern)
        const toggleRecording = async () => {
            // If not recording -> Start countdown then record
            if (this.ui.recordingBadge.classList.contains('hidden')) {
                if (!this.ui.participantData) return alert("Primero confirma tus datos de participante.");
                if (!this.ui.currentWord) return alert("Selecciona un ítem para grabar.");
                if (this.ui.currentRepetition > 10) return alert("Esta seña ya tiene sus 10 repeticiones. Elige otra seña.");
                
                // Block UI during countdown
                this.ui.btnRecord.disabled = true;
                this.ui.btnRecordMobile.disabled = true;
                if (this.ui.btnSwitchCamera) this.ui.btnSwitchCamera.classList.add('hidden');

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
                        ...meta, 
                        capture_id: crypto.randomUUID ? crypto.randomUUID() : `C-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                        session_id: this.sessionId,
                        capture_datetime: new Date().toISOString(),
                        width: this.currentRecording.width,
                        height: this.currentRecording.height,
                        duration_sec: parseFloat(this.currentRecording.duration.toFixed(2)),
                        device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
                    };

                    const response = await this.uploader.uploadData(this.currentRecording.videoBlob, payload);
                    console.log("Subida exitosa:", response.sample_id);
                    
                    this.ui.setFinishedState(response.progress);
                    this.currentRecording = null;
                } catch (error) {
                    this.ui.setErrorState(error.message);
                }
            });
        }
    }
}
