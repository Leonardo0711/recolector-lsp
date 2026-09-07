export class UIController {
    constructor() {
        // --- Participant Auth Elements ---
        this.participantCard = document.getElementById('participantCard');
        this.authCardTitle = document.getElementById('authCardTitle');
        this.authStepEmail = document.getElementById('authStepEmail');
        this.authStepNewUser = document.getElementById('authStepNewUser');
        this.authStepReturningUser = document.getElementById('authStepReturningUser');
        this.authStepActiveSession = document.getElementById('authStepActiveSession');

        this.authEmail = document.getElementById('authEmail');
        this.btnCheckEmail = document.getElementById('btnCheckEmail');

        this.displayTempCode = document.getElementById('displayTempCode');
        this.authTempCode = document.getElementById('authTempCode');
        this.authNewPassword = document.getElementById('authNewPassword');
        this.authConfirmPassword = document.getElementById('authConfirmPassword');
        this.btnCompleteRegistration = document.getElementById('btnCompleteRegistration');
        this.btnBackToEmailNew = document.getElementById('btnBackToEmailNew');

        this.greetingAlias = document.getElementById('greetingAlias');
        this.greetingEmail = document.getElementById('greetingEmail');
        this.authLoginPassword = document.getElementById('authLoginPassword');
        this.btnLogin = document.getElementById('btnLogin');
        this.btnBackToEmailReturning = document.getElementById('btnBackToEmailReturning');

        this.activeProfileAlias = document.getElementById('activeProfileAlias');
        this.activeProfileEmail = document.getElementById('activeProfileEmail');
        this.activeProfileRole = document.getElementById('activeProfileRole');
        this.activeProfileHand = document.getElementById('activeProfileHand');
        this.activeProfileLevel = document.getElementById('activeProfileLevel');
        this.activeProfileRegion = document.getElementById('activeProfileRegion');
        this.adminPanelQuickLink = document.getElementById('adminPanelQuickLink');
        this.btnGoToAdmin = document.getElementById('btnGoToAdmin');
        this.btnLogout = document.getElementById('btnLogout');

        // Form fields for profile
        this.participantAlias = document.getElementById('participantAlias');
        this.participantAge = document.getElementById('participantAge');
        this.participantRegion = document.getElementById('participantRegion');
        this.participantHand = document.getElementById('participantHand');
        this.participantLevel = document.getElementById('participantLevel');
        this.participantType = document.getElementById('participantType');

        // --- Capture Mode ---
        this.modeSelect = document.getElementById('modeSelect');
        this.selectorTitle = document.getElementById('selectorTitle');

        // --- Consent ---
        this.consentCard = document.getElementById('consentCard');
        this.consentCheckboxes = {
            research: document.getElementById('consentResearch'),
            storage: document.getElementById('consentStorage'),
            training: document.getElementById('consentTraining'),
            age: document.getElementById('consentAge')
        };

        // --- Word/Prompt Selector ---
        this.wordSelectorCard = document.getElementById('wordSelectorCard');
        this.categorySelect = document.getElementById('categorySelect');
        this.wordSelect = document.getElementById('wordSelect');
        this.wordSearch = document.getElementById('wordSearch');
        this.searchContainer = document.getElementById('searchContainer');
        this.repetitionContainer = document.getElementById('repetitionContainer');
        this.repetitionCircles = document.querySelectorAll('.circle');
        this.promptInstructions = document.getElementById('promptInstructions');
        this.promptTextDisplay = document.getElementById('promptTextDisplay');
        this.durationLimitNote = document.getElementById('durationLimitNote');

        // --- Video & Controls ---
        this.webcam = document.getElementById('webcam');
        this.previewPlayer = document.getElementById('previewPlayer');
        this.btnStartCamera = document.getElementById('btnStartCamera');
        this.btnStartCameraMobile = document.getElementById('btnStartCameraMobile');
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');
        this.btnRecordMobile = document.getElementById('btnRecordMobile');
        this.btnSwitchCamera = document.getElementById('btnSwitchCamera');
        
        // --- Review & Annotation ---
        this.reviewOverlay = document.getElementById('reviewOverlay');
        this.btnAccept = document.getElementById('btnAccept');
        this.btnRepeat = document.getElementById('btnRepeat');
        this.techStats = document.getElementById('techStats');
        this.statRes = document.getElementById('statRes');
        this.statDur = document.getElementById('statDur');
        
        // Scientific Annotation Panel
        this.annotationPanel = document.getElementById('annotationPanel');
        this.producedTextEs = document.getElementById('producedTextEs');
        this.handsVisible = document.getElementById('handsVisible');
        this.faceVisible = document.getElementById('faceVisible');
        this.bodyVisible = document.getElementById('bodyVisible');
        this.promptAdherence = document.getElementById('promptAdherence');
        this.occlusionLevel = document.getElementById('occlusionLevel');
        this.flagIncomplete = document.getElementById('flagIncomplete');

        // --- Protocol ---
        this.protocolOverlay = document.getElementById('protocolOverlay');
        this.btnCloseProtocol = document.getElementById('btnCloseProtocol');

        // --- Upload Status ---
        this.uploadStatusUI = document.getElementById('uploadStatusUI');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');
        this.uploadStatusMobile = document.getElementById('uploadStatusMobile');
        this.uploadProgressBarMobile = document.getElementById('uploadProgressBarMobile');

        // --- Badges & Overlays ---
        this.recordingBadge = document.getElementById('recordingBadge');
        this.palabraOverlay = document.getElementById('palabraOverlay');
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.countdownNumber = document.getElementById('countdownNumber');
        this.targetTextOverlay = document.getElementById('targetTextOverlay');
        this.targetTextLabel = document.getElementById('targetTextLabel');

        // Initial State
        this.vocab = [];
        this.currentWord = null;
        this.currentRepetition = 1;
        this.participantData = null;
        this.participantProgress = {};
        this.lastLabelId = null;
        this.pendingResumeSession = null;
        this.registerParticipantHandler = null;
        this.resumeParticipantHandler = null;
        this.authHandlers = null;

        this.initAuthLogic();
        this.initModeLogic();
        this.initReviewButtons();
        this.initProtocol();
        this.initSearchLogic();
        
        // Load existing participant session if available
        this.loadParticipantFromStorage();
    }

    // ========== DATA & VOCABULARY ==========
    async loadVocab() {
        const file = 'lexicon_isolated_v1.json';

        try {
            const response = await fetch(`./data/${file}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            // Robustness: Handle if data is wrapped in an object or is a direct array
            this.vocab = Array.isArray(data) ? data : (data.items || data.data || []);
            
            console.log(`Vocabulario cargado (${file}):`, this.vocab.length, "ítems");
            if (this.vocab.length > 0) {
                console.log("Ejemplo ítem:", this.vocab[0]);
            } else {
                console.warn("El vocabulario está vacío.");
            }
            
            this.updateSelectorUI();
        } catch (error) {
            console.error("Error crítico cargando vocabulario:", error);
            alert(`Error de datos: No se pudo cargar ${file}. Verifica que el archivo existe en src/data/`);
        }
    }

    initModeLogic() {
        // El protocolo de bachiller captura únicamente señas aisladas.
        this.modeSelect.value = 'isolated';
    }

    updateSelectorUI() {
        const mode = this.modeSelect.value;
        this.categorySelect.innerHTML = '<option value="">-- Selecciona Categoría --</option>';
        this.wordSelect.innerHTML = '<option value="">-- Selecciona Ítem --</option>';
        this.wordSelect.disabled = true;

        if (!this.vocab || this.vocab.length === 0) {
            console.warn("No hay vocabulario para mostrar en la UI.");
            return;
        }

        if (mode === 'continuous') {
            this.selectorTitle.textContent = "Prompt Continuo";
            this.categorySelect.parentElement.classList.add('hidden');
            this.searchContainer.classList.remove('hidden');
            this.repetitionContainer.classList.add('hidden');
            this.populateContinuousList(this.vocab);
        } else {
            this.selectorTitle.textContent = mode === 'template' ? "Secuencia a Grabar" : "Palabra a Grabar";
            this.categorySelect.parentElement.classList.remove('hidden');
            this.searchContainer.classList.remove('hidden');
            this.repetitionContainer.classList.remove('hidden');
            
            // Extract unique categories robustly
            const cats = this.vocab.map(v => v.categoria || v.category || v.group).filter(Boolean);
            const uniqueCats = Array.from(new Set(cats)).sort();
            
            console.log("Categorías detectadas:", uniqueCats);
            this.populateCategories(uniqueCats);
        }
    }

    initSearchLogic() {
        this.wordSearch.oninput = () => {
            const query = this.wordSearch.value.toLowerCase().trim();
            const mode = this.modeSelect.value;
            
            if (query === "") {
                if (mode === 'continuous') this.populateContinuousList(this.vocab);
                else {
                    const cat = this.categorySelect.value;
                    const words = cat ? this.vocab.filter(v => (v.categoria || v.category) === cat) : [];
                    this.populateWords(words);
                }
                return;
            }

            let filtered = [];
            if (mode === 'continuous') {
                filtered = this.vocab.filter(v => v.prompt_text.toLowerCase().includes(query));
                this.renderWordOptions(filtered, 'prompt_id', 'prompt_text');
            } else {
                const cat = this.categorySelect.value;
                // Allow search across ALL categories if none selected, or filter by current
                filtered = this.vocab.filter(v => {
                    const matchesCat = !cat || (v.categoria || v.category) === cat;
                    const label = (v.label || v.prompt_text || "").toLowerCase();
                    return matchesCat && label.includes(query);
                });
                this.renderWordOptions(filtered, 'label_id', 'label');
            }
        };
    }

    renderWordOptions(items, idKey, textKey) {
        this.wordSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[idKey] || item.label_id || item.prompt_id || "";
            opt.textContent = item[textKey] || item.label || item.prompt_text || "";
            this.wordSelect.appendChild(opt);
        });
        this.wordSelect.disabled = items.length === 0;
    }

    populateCategories(categories) {
        this.categorySelect.innerHTML = '<option value="">-- Elige Categoría --</option>';
        if (categories.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = "(No se encontraron categorías)";
            this.categorySelect.appendChild(opt);
            return;
        }

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            this.categorySelect.appendChild(opt);
        });

        this.categorySelect.onchange = () => {
            const cat = this.categorySelect.value;
            const words = this.vocab.filter(v => (v.categoria || v.category) === cat);
            this.wordSearch.value = ""; // Reset search on cat change
            this.populateWords(words);
        };
    }

    populateWords(words) {
        this.renderWordOptions(words, 'label_id', 'label');
        
        this.wordSelect.onchange = () => {
            const val = this.wordSelect.value;
            this.currentWord = words.find(v => (v.label_id || v.prompt_id || "") === val);
            this.updatePromptUI();
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        };
    }

    populateContinuousList(items) {
        this.renderWordOptions(items, 'prompt_id', 'prompt_text');

        this.wordSelect.onchange = () => {
            const promptId = this.wordSelect.value;
            this.currentWord = items.find(i => (i.prompt_id || i.label_id || "") === promptId);
            this.updatePromptUI();
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        };
    }

    updatePromptUI() {
        if (!this.currentWord) {
            this.promptInstructions.classList.add('hidden');
            return;
        }

        this.promptInstructions.classList.remove('hidden');
        this.promptTextDisplay.textContent = this.currentWord.prompt_text || this.currentWord.label;
        
        if (this.currentWord.duration_min) {
            this.durationLimitNote.textContent = `Duración recomendada: ${this.currentWord.duration_min}-${this.currentWord.duration_max}s`;
        } else {
            const limits = { isolated: '2-4s', expression: '2-5s', template: '3-7s' };
            this.durationLimitNote.textContent = `Límite sugerido: ${limits[this.modeSelect.value] || '--'}`;
        }
    }

    // ========== REPETITION PERSISTENCE ==========
    loadRepetitionProgress() {
        if (!this.currentWord) return;
        const id = this.currentWord.label_id || this.currentWord.prompt_id;
        this.currentRepetition = (this.participantProgress[id] || 0) + 1;
    }

    saveRepetitionProgress() {
        // El progreso válido vive en Google Sheets, no solo en el navegador.
    }

    // ========== PARTICIPANT AUTHENTICATION & SESSION ==========
    showAuthStep(step) {
        if (this.authStepEmail) this.authStepEmail.classList.add('hidden');
        if (this.authStepNewUser) this.authStepNewUser.classList.add('hidden');
        if (this.authStepReturningUser) this.authStepReturningUser.classList.add('hidden');
        if (this.authStepActiveSession) this.authStepActiveSession.classList.add('hidden');

        if (step === 'email' && this.authStepEmail) {
            this.authStepEmail.classList.remove('hidden');
            if (this.authCardTitle) this.authCardTitle.textContent = "Acceso de Participante";
            this.wordSelectorCard.classList.add('hidden');
        } else if (step === 'new' && this.authStepNewUser) {
            this.authStepNewUser.classList.remove('hidden');
            if (this.authCardTitle) this.authCardTitle.textContent = "Activar Cuenta (Primer Ingreso)";
        } else if (step === 'returning' && this.authStepReturningUser) {
            this.authStepReturningUser.classList.remove('hidden');
            if (this.authCardTitle) this.authCardTitle.textContent = "Iniciar Sesión";
        } else if (step === 'active' && this.authStepActiveSession) {
            this.authStepActiveSession.classList.remove('hidden');
            if (this.authCardTitle) this.authCardTitle.textContent = "Sesión Activa";
            this.wordSelectorCard.classList.remove('hidden');
        }
    }

    initAuthLogic() {
        if (this.btnCheckEmail) {
            this.btnCheckEmail.addEventListener('click', async () => {
                const email = (this.authEmail.value || "").trim().toLowerCase();
                if (!email || !email.includes('@')) {
                    return this._alert("Por favor ingresa un correo electrónico válido.");
                }
                if (!this.authHandlers || !this.authHandlers.checkEmail) {
                    return this._alert("Servicio de autenticación no inicializado.");
                }

                try {
                    this.btnCheckEmail.disabled = true;
                    this.btnCheckEmail.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
                    const res = await this.authHandlers.checkEmail(email);

                    if (res.is_new || res.must_change_password) {
                        // Usuario nuevo o que aún no define contraseña: código autorrellenado
                        if (this.displayTempCode) this.displayTempCode.textContent = res.temp_code || "LSP-XXXX";
                        if (this.authTempCode) this.authTempCode.value = res.temp_code || "";
                        if (res.alias && this.participantAlias) this.participantAlias.value = res.alias;
                        this.showAuthStep('new');
                        if (this.authNewPassword) this.authNewPassword.focus();
                    } else {
                        // Usuario recurrente con contraseña
                        if (this.greetingAlias) this.greetingAlias.textContent = res.alias || email.split('@')[0];
                        if (this.greetingEmail) this.greetingEmail.textContent = email;
                        if (this.authLoginPassword) this.authLoginPassword.value = "";
                        this.showAuthStep('returning');
                        if (this.authLoginPassword) this.authLoginPassword.focus();
                    }
                } catch (err) {
                    this._alert(err.message || "Error al verificar el correo.");
                } finally {
                    this.btnCheckEmail.disabled = false;
                    this.btnCheckEmail.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Continuar';
                }
            });
        }

        if (this.btnBackToEmailNew) {
            this.btnBackToEmailNew.addEventListener('click', () => this.showAuthStep('email'));
        }
        if (this.btnBackToEmailReturning) {
            this.btnBackToEmailReturning.addEventListener('click', () => this.showAuthStep('email'));
        }

        if (this.btnCompleteRegistration) {
            this.btnCompleteRegistration.addEventListener('click', async () => {
                const email = (this.authEmail.value || "").trim().toLowerCase();
                const tempCode = (this.authTempCode.value || "").trim();
                const newPass = (this.authNewPassword.value || "").trim();
                const confirmPass = (this.authConfirmPassword.value || "").trim();

                if (!newPass || newPass.length < 4) {
                    return this._alert("La contraseña debe tener al menos 4 caracteres.");
                }
                if (newPass !== confirmPass) {
                    return this._alert("Las contraseñas no coinciden. Por favor verifícalas.");
                }
                if (!this.validateParticipantForm()) return;

                try {
                    this.btnCompleteRegistration.disabled = true;
                    this.btnCompleteRegistration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
                    
                    const profile = this.readParticipantForm();
                    profile.email = email;
                    const session = await this.authHandlers.completeRegistration(email, tempCode, newPass, profile);
                    this.activateParticipantSession(session, profile);
                } catch (err) {
                    this._alert(err.message || "Error al completar registro.");
                } finally {
                    this.btnCompleteRegistration.disabled = false;
                    this.btnCompleteRegistration.innerHTML = '<i class="fa-solid fa-user-check"></i> Activar Cuenta y Continuar';
                }
            });
        }

        if (this.btnLogin) {
            this.btnLogin.addEventListener('click', async () => {
                const email = (this.authEmail.value || "").trim().toLowerCase();
                const pass = (this.authLoginPassword.value || "").trim();
                if (!pass) return this._alert("Ingresa tu contraseña.");

                try {
                    this.btnLogin.disabled = true;
                    this.btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ingresando...';
                    const session = await this.authHandlers.login(email, pass);
                    this.activateParticipantSession(session, session.participant);
                } catch (err) {
                    this._alert(err.message || "Error de inicio de sesión.");
                } finally {
                    this.btnLogin.disabled = false;
                    this.btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                }
            });
        }

        if (this.btnGoToAdmin) {
            this.btnGoToAdmin.addEventListener('click', () => {
                window.location.hash = '#admin';
            });
        }

        if (this.btnLogout) {
            this.btnLogout.addEventListener('click', () => {
                if (confirm("¿Deseas cerrar tu sesión actual?")) {
                    localStorage.removeItem('lsp_user_session');
                    localStorage.removeItem('lsp_participant_profile');
                    localStorage.removeItem('lsp_participant_uuid');
                    localStorage.removeItem('lsp_participant_resume_code');
                    if (this.authHandlers && this.authHandlers.onLogout) {
                        this.authHandlers.onLogout();
                    }
                    this.participantData = null;
                    this.participantProgress = {};
                    this.showAuthStep('email');
                }
            });
        }
    }

    setAuthHandlers(handlers) {
        this.authHandlers = handlers;
    }

    setParticipantHandlers(handlers) {
        // Compatibilidad hacia atrás
        this.setAuthHandlers(handlers);
    }

    readParticipantForm() {
        return {
            alias: this.participantAlias.value.trim().toUpperCase(),
            age: this.participantAge.value,
            region: this.participantRegion.value,
            dominant_hand: this.participantHand.value,
            hand: this.participantHand.value,
            lsp_level: this.participantLevel.value,
            level: this.participantLevel.value,
            participant_type: this.participantType.value,
            type: this.participantType.value,
            consent_research: this.consentCheckboxes.research.checked,
            consent_training: this.consentCheckboxes.training.checked,
            consent_storage: this.consentCheckboxes.storage.checked,
            consent_age: this.consentCheckboxes.age.checked
        };
    }

    fillParticipantForm(p) {
        if (!p) return;
        if (this.participantAlias) this.participantAlias.value = p.alias || "";
        if (this.participantAge) this.participantAge.value = p.age || "";
        if (this.participantRegion) this.participantRegion.value = p.region || "";
        if (this.participantHand) this.participantHand.value = p.dominant_hand || p.hand || "";
        if (this.participantLevel) this.participantLevel.value = p.lsp_level || p.level || "";
        if (this.participantType) this.participantType.value = p.participant_type || p.type || "";
    }

    activateParticipantSession(session, fallbackProfile) {
        this.participantData = session.participant || fallbackProfile;
        if (session.role) this.participantData.role = session.role;
        this.applyProgress(session.progress || {});

        // Persistir sesión y UUID en localStorage
        localStorage.setItem('lsp_user_session', JSON.stringify(session));
        if (this.participantData && this.participantData.participant_id) {
            localStorage.setItem('lsp_participant_uuid', this.participantData.participant_id);
        }

        // Actualizar tarjeta de perfil activo
        if (this.activeProfileAlias) this.activeProfileAlias.textContent = this.participantData.alias || "Participante";
        if (this.activeProfileEmail) this.activeProfileEmail.textContent = this.participantData.email || (this.authEmail ? this.authEmail.value.trim() : "") || "";
        if (this.activeProfileRole) {
            this.activeProfileRole.textContent = session.role === 'admin' ? "Administrador" : "Participante";
        }
        if (this.activeProfileHand) {
            this.activeProfileHand.textContent = this.participantData.dominant_hand || this.participantData.hand || "N/A";
        }
        if (this.activeProfileLevel) {
            this.activeProfileLevel.textContent = this.participantData.lsp_level || this.participantData.level || "N/A";
        }
        if (this.activeProfileRegion) {
            this.activeProfileRegion.textContent = this.participantData.region || "N/A";
        }

        if (this.adminPanelQuickLink) {
            if (session.role === 'admin') {
                this.adminPanelQuickLink.classList.remove('hidden');
            } else {
                this.adminPanelQuickLink.classList.add('hidden');
            }
        }

        this.showAuthStep('active');
        this.wordSelectorCard.classList.remove('hidden');
        this.saveParticipantToStorage();
        this.selectResumeWord();
        
        if (this.authHandlers && this.authHandlers.onSessionActive) {
            this.authHandlers.onSessionActive(session);
        }
    }

    applyProgress(progress) {
        this.participantProgress = progress.by_label || {};
        this.lastLabelId = progress.last_label_id || null;
    }

    selectResumeWord() {
        if (!this.vocab.length) return;
        let item = this.vocab.find(v => v.label_id === this.lastLabelId && (this.participantProgress[v.label_id] || 0) < 10);
        if (!item) item = this.vocab.find(v => (this.participantProgress[v.label_id] || 0) < 10);
        if (!item) {
            this.wordSelect.value = "";
            this.currentWord = null;
            this.promptInstructions.classList.remove('hidden');
            this.promptTextDisplay.textContent = "¡Completaste las 40 señas y sus 10 repeticiones!";
            this.durationLimitNote.textContent = "Gracias por completar el protocolo.";
            return;
        }
        this.categorySelect.value = item.categoria;
        const words = this.vocab.filter(v => v.categoria === item.categoria);
        this.populateWords(words);
        this.wordSelect.value = item.label_id;
        this.currentWord = item;
        this.updatePromptUI();
        this.loadRepetitionProgress();
        this.updateRepetitionUI();
    }

    loadParticipantFromStorage() {
        const savedSession = localStorage.getItem('lsp_user_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (session && session.participant) {
                    this.activateParticipantSession(session, session.participant);
                    return;
                }
            } catch (e) {
                console.warn("Sesión inválida guardada:", e);
            }
        }
        this.showAuthStep('email');
    }

    saveParticipantToStorage() {
        if (this.participantData) {
            localStorage.setItem('lsp_participant_profile', JSON.stringify(this.participantData));
        }
    }

    validateParticipantForm() {
        if (!this.participantAlias.value.trim()) return this._alert("Ingresa un alias o código");
        if (!this.participantAge.value) return this._alert("Selecciona rango de edad");
        if (!this.participantRegion.value) return this._alert("Selecciona región");
        if (!this.participantHand.value) return this._alert("Selecciona mano dominante");
        if (!this.participantLevel.value) return this._alert("Selecciona tu nivel de LSP");
        if (!this.participantType.value) return this._alert("Selecciona tu tipo de perfil");
        
        // Consent
        if (!this.consentCheckboxes.research.checked || 
            !this.consentCheckboxes.storage.checked || 
            !this.consentCheckboxes.training.checked || 
            !this.consentCheckboxes.age.checked) {
            return this._alert("Debes aceptar todos los puntos de consentimiento ético.");
        }
        return true;
    }

    lockParticipantForm() {
        this.showAuthStep('active');
    }

    _alert(msg) {
        alert(msg);
        return false;
    }

    // ========== PROTOCOL & COUNTDOWN ==========
    initProtocol() {
        this.btnCloseProtocol.addEventListener('click', () => {
            this.protocolOverlay.classList.add('hidden');
        });
    }

    async startCountdown() {
        this.countdownOverlay.classList.remove('hidden');
        for (let i = 3; i > 0; i--) {
            this.countdownNumber.textContent = i;
            await new Promise(r => setTimeout(r, 1000));
        }
        this.countdownOverlay.classList.add('hidden');
    }

    // ========== STATE TRANSITIONS ==========
    setCameraReadyState() {
        this.btnStartCamera.classList.add('hidden');
        if (this.btnStartCameraMobile) this.btnStartCameraMobile.classList.add('hidden');
        this.btnRecord.disabled = false;
        this.btnRecordMobile.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');
        if (this.btnSwitchCamera) this.btnSwitchCamera.classList.remove('hidden');
    }

    setRecordingState() {
        this.wordSelect.disabled = true;
        this.categorySelect.disabled = true;
        
        // Desktop
        this.btnRecord.classList.add('hidden');
        this.btnStop.classList.remove('hidden');

        // Mobile (Toggle text/icon)
        this.btnRecordMobile.innerHTML = '<i class="fa-solid fa-square"></i> Detener';
        this.btnRecordMobile.classList.replace('btn-record', 'btn-stop');
        this.btnRecordMobile.disabled = false;

        if (this.btnSwitchCamera) this.btnSwitchCamera.classList.add('hidden');

        this.recordingBadge.classList.remove('hidden');
        this.palabraOverlay.textContent = this.currentWord.label || "GRABANDO...";
        this.palabraOverlay.classList.remove('hidden');

        // Target text overlay
        this.targetTextLabel.textContent = this.currentWord.prompt_text || this.currentWord.label;
        this.targetTextOverlay.classList.remove('hidden');
    }

    showPreview(videoBlob, stats) {
        // Reset states
        this.recordingBadge.classList.add('hidden');
        this.palabraOverlay.classList.add('hidden');
        this.targetTextOverlay.classList.add('hidden');
        
        // Desktop
        this.btnStop.classList.add('hidden');
        this.btnRecord.classList.remove('hidden');
        this.btnRecord.disabled = true; 

        // Mobile (Reset to record look)
        this.btnRecordMobile.innerHTML = '<i class="fa-solid fa-circle"></i> Grabar';
        this.btnRecordMobile.classList.replace('btn-stop', 'btn-record');
        this.btnRecordMobile.classList.add('hidden');

        if (this.btnSwitchCamera) this.btnSwitchCamera.classList.add('hidden');

        // Show tech stats
        this.statRes.innerHTML = `<i class="fa-solid fa-expand"></i> ${stats.width}x${stats.height}`;
        this.statDur.innerHTML = `<i class="fa-solid fa-clock"></i> ${stats.duration.toFixed(1)}s`;
        this.techStats.classList.remove('hidden');

        // Setup Preview Player
        const url = URL.createObjectURL(videoBlob);
        this.previewPlayer.src = url;
        this.previewPlayer.loop = true;
        this.previewPlayer.muted = true;
        this.previewPlayer.playsInline = true;
        this.previewPlayer.classList.remove('hidden');
        this.webcam.classList.add('hidden');
        
        // Play the video preview in a loop automatically
        this.previewPlayer.play().catch(err => {
            console.warn("Autoplay was prevented or failed:", err);
        });

        // Show Review Overlay & Scientific Annotation
        this.reviewOverlay.classList.remove('hidden');
        this.annotationPanel.classList.remove('hidden');
        
        // Rigor: Do NOT pre-fill value (to avoid contamination). 
        // Use placeholder as hint so the annotator must explicitly confirm/type.
        this.producedTextEs.value = "";
        this.producedTextEs.placeholder = `Sugerido: ${this.currentWord.prompt_text || this.currentWord.label || ""}`;
    }

    hidePreview() {
        this.reviewOverlay.classList.add('hidden');
        this.annotationPanel.classList.add('hidden');
        this.flagIncomplete.checked = false;
        this.previewPlayer.classList.add('hidden');
        this.previewPlayer.src = "";
        this.webcam.classList.remove('hidden');
        this.techStats.classList.add('hidden');
        
        // Restore record buttons
        this.btnRecord.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');
        this.btnRecordMobile.disabled = false;
        if (this.btnSwitchCamera) this.btnSwitchCamera.classList.remove('hidden');
        this.wordSelect.disabled = false;
        this.categorySelect.disabled = false;
    }

    initReviewButtons() {
        this.btnRepeat.addEventListener('click', () => {
            this.hidePreview();
        });
    }

    updateRepetitionUI() {
        this.repetitionCircles.forEach(c => {
            const rep = parseInt(c.dataset.rep);
            c.className = 'circle';
            if (rep < this.currentRepetition) c.classList.add('completed');
            if (rep === this.currentRepetition) c.classList.add('active');
        });
        if (this.currentRepetition > 10 && this.currentWord) {
            this.durationLimitNote.textContent = "Completada: 10 de 10 repeticiones guardadas.";
        }
    }

    setUploadingState() {
        this.reviewOverlay.classList.add('hidden');
        this.uploadStatusUI.classList.remove('hidden');
        this.uploadProgressBar.style.width = '50%';
        this.uploadStatusMobile.classList.remove('hidden');
        this.uploadProgressBarMobile.style.width = '50%';
    }

    setFinishedState(progress) {
        this.uploadProgressBar.style.width = '100%';
        this.uploadStatusUI.querySelector('.status-text').textContent = "¡Subida exitosa!";
        this.uploadProgressBarMobile.style.width = '100%';
        
        this.applyProgress(progress || {});
        this.loadRepetitionProgress();
        this.updateRepetitionUI();
        this.hidePreview();

        setTimeout(() => {
            this.uploadStatusUI.classList.add('hidden');
            this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo a Drive...';
            this.uploadStatusMobile.classList.add('hidden');
        }, 3000);
    }

    setErrorState(msg) {
        alert("Error: " + msg);
        this.uploadStatusUI.classList.add('hidden');
        this.uploadStatusMobile.classList.add('hidden');
        this.reviewOverlay.classList.remove('hidden');
    }

    getMetadata() {
        const mode = this.modeSelect.value;
        const p = this.participantData || {};
        const w = this.currentWord || {};

        return {
            // Participant (Flattened and Mapped for GAS)
            participant_id: p.participant_id || localStorage.getItem('lsp_participant_uuid'),
            participant_resume_code: p.temp_code || localStorage.getItem('lsp_participant_resume_code'),
            email: p.email || (this.authEmail ? this.authEmail.value.trim() : ""),
            alias: p.alias,
            age: p.age,
            region: p.region,
            dominant_hand: p.dominant_hand || p.hand,
            lsp_level: p.lsp_level || p.level,
            participant_type: p.participant_type || p.type,

            // Ethical Consent (Actual states + explicit age consent)
            consent_research: Boolean(p.consent_research !== undefined ? p.consent_research : this.consentCheckboxes.research?.checked),
            consent_training: Boolean(p.consent_training !== undefined ? p.consent_training : this.consentCheckboxes.training?.checked),
            consent_storage: Boolean(p.consent_storage !== undefined ? p.consent_storage : this.consentCheckboxes.storage?.checked),
            consent_age: Boolean(p.consent_age !== undefined ? p.consent_age : this.consentCheckboxes.age?.checked),

            // Capture Metadata
            capture_mode: mode,
            label_id: w.label_id || w.prompt_id || "N/A",
            label: w.label || w.prompt_text || "N/A",
            prompt_id: w.prompt_id || w.label_id || "N/A",
            prompt_text: w.prompt_text || w.label || "N/A",
            repetition: this.currentRepetition,
            
            // Translation & Linguistic (Real production annotation)
            produced_text_es: this.producedTextEs.value.trim(),
            produced_text_es_normalized: this.producedTextEs.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), 
            gloss_reference: w.gloss_reference || "",
            annotation_status: "self_annotated",
            split: "unassigned",
            
            // Quality Flags (In-situ scientific annotation)
            failed_capture: this.flagIncomplete.checked,
            hands_visible: this.handsVisible.checked,
            face_visible: this.faceVisible.checked,
            body_visible: this.bodyVisible.checked,
            occlusion_level: this.occlusionLevel.value,
            linguistic_acceptability: "pending_review",
            prompt_adherence: this.promptAdherence.checked,
            
            // Technical
            app_version: "2.1.0-scientific-ready",
            dataset_phase: "1-B"
        };
    }
}
