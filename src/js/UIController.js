export class UIController {
    constructor() {
        // --- Views & Containers ---
        this.landing = document.getElementById('landing');
        this.authView = document.getElementById('authView');
        this.appContainer = document.getElementById('appContainer');
        this.btnBackToLandingFromAuth = document.getElementById('btnBackToLandingFromAuth');
        this.activeSessionCard = document.getElementById('activeSessionCard');

        // --- Participant Auth Elements ---
        this.authStepEmail = document.getElementById('authStepEmail');
        this.authStepNewUser = document.getElementById('authStepNewUser');
        this.authStepReturningUser = document.getElementById('authStepReturningUser');
        this.authStepResetPassword = document.getElementById('authStepResetPassword');

        this.authEmail = document.getElementById('authEmail');
        this.btnCheckEmail = document.getElementById('btnCheckEmail');

        this.displayTempCode = document.getElementById('displayTempCode');
        this.authTempCode = document.getElementById('authTempCode');
        this.authNewPassword = document.getElementById('authNewPassword');
        this.authConfirmPassword = document.getElementById('authConfirmPassword');
        this.passwordMatchStatus = document.getElementById('passwordMatchStatus');
        this.btnCompleteRegistration = document.getElementById('btnCompleteRegistration');
        this.btnBackToEmailNew = document.getElementById('btnBackToEmailNew');

        this.greetingAlias = document.getElementById('greetingAlias');
        this.greetingEmail = document.getElementById('greetingEmail');
        this.authLoginPassword = document.getElementById('authLoginPassword');
        this.btnLogin = document.getElementById('btnLogin');
        this.btnBackToEmailReturning = document.getElementById('btnBackToEmailReturning');
        this.btnForgotPwdHelp = document.getElementById('btnForgotPwdHelp');

        // Reset Password step elements
        this.resetUserEmail = document.getElementById('resetUserEmail');
        this.authResetTempCode = document.getElementById('authResetTempCode');
        this.authResetNewPassword = document.getElementById('authResetNewPassword');
        this.authResetConfirmPassword = document.getElementById('authResetConfirmPassword');
        this.btnCompleteResetPassword = document.getElementById('btnCompleteResetPassword');
        this.btnBackToEmailReset = document.getElementById('btnBackToEmailReset');

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

        // --- Word/Prompt Selector & Combobox ---
        this.wordSelectorCard = document.getElementById('wordSelectorCard');
        this.comboboxWrapper = document.getElementById('comboboxWrapper');
        this.wordSearchInput = document.getElementById('wordSearchInput');
        this.comboboxToggleBtn = document.getElementById('comboboxToggleBtn');
        this.comboboxDropdown = document.getElementById('comboboxDropdown');
        this.comboboxOptionsList = document.getElementById('comboboxOptionsList');
        this.repetitionCounterText = document.getElementById('repetitionCounterText');
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
        this.initCombobox();
        
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
        if (!this.vocab || this.vocab.length === 0) {
            console.warn("No hay vocabulario para mostrar en la UI.");
            return;
        }

        // Render options in unified combobox
        this.renderComboboxOptions();

        // Populate hidden wordSelect for backwards compatibility
        if (this.wordSelect) {
            this.wordSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
            this.vocab.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.label_id || item.prompt_id || "";
                opt.textContent = item.label || item.prompt_text || "";
                this.wordSelect.appendChild(opt);
            });
        }

        // If participant session is active, select resume word
        if (this.participantData) {
            this.selectResumeWord();
        }
    }

    initCombobox() {
        if (!this.wordSearchInput || !this.comboboxDropdown) return;

        // Open/filter on typing
        this.wordSearchInput.addEventListener('input', () => {
            const query = this.wordSearchInput.value.trim();
            this.renderComboboxOptions(query);
            this.openCombobox();
        });

        // Open on focus
        this.wordSearchInput.addEventListener('focus', () => {
            const query = this.wordSearchInput.value.trim();
            this.renderComboboxOptions(query);
            this.openCombobox();
        });

        // Toggle button click
        if (this.comboboxToggleBtn) {
            this.comboboxToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.comboboxDropdown.classList.contains('hidden')) {
                    this.renderComboboxOptions(this.wordSearchInput.value.trim());
                    this.openCombobox();
                    this.wordSearchInput.focus();
                } else {
                    this.closeCombobox();
                }
            });
        }

        // Close when clicking outside combobox
        document.addEventListener('click', (e) => {
            if (this.comboboxWrapper && !this.comboboxWrapper.contains(e.target)) {
                this.closeCombobox();
            }
        });

        // Repetition circles click event
        this.repetitionCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                const rep = parseInt(circle.dataset.rep);
                if (rep >= 1 && rep <= 10) {
                    this.currentRepetition = rep;
                    this.updateRepetitionUI();
                }
            });
        });
    }

    openCombobox() {
        if (this.comboboxDropdown) {
            this.comboboxDropdown.classList.remove('hidden');
        }
        if (this.comboboxToggleBtn) {
            this.comboboxToggleBtn.classList.add('open');
        }
    }

    closeCombobox() {
        if (this.comboboxDropdown) {
            this.comboboxDropdown.classList.add('hidden');
        }
        if (this.comboboxToggleBtn) {
            this.comboboxToggleBtn.classList.remove('open');
        }
    }

    renderComboboxOptions(filter = '') {
        if (!this.comboboxOptionsList) return;
        this.comboboxOptionsList.innerHTML = '';

        const normalizedFilter = filter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const filtered = this.vocab.filter(item => {
            if (!normalizedFilter) return true;
            const labelNorm = (item.label || item.prompt_text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const catNorm = (item.categoria || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return labelNorm.includes(normalizedFilter) || catNorm.includes(normalizedFilter);
        });

        if (filtered.length === 0) {
            const noRes = document.createElement('div');
            noRes.className = 'combobox-no-results';
            noRes.innerHTML = '<i class="fa-solid fa-circle-question"></i> No se encontraron señas';
            this.comboboxOptionsList.appendChild(noRes);
            return;
        }

        filtered.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'combobox-item';
            const id = item.label_id || item.prompt_id;
            const completedReps = this.participantProgress[id] || 0;
            const isSelected = this.currentWord && (this.currentWord.label_id || this.currentWord.prompt_id) === id;

            if (isSelected) {
                itemEl.classList.add('selected');
            }

            let badgeClass = 'item-progress-badge';
            let badgeText = `${completedReps}/10`;
            if (completedReps >= 10) {
                badgeClass += ' completed';
                badgeText = '10/10 ✓';
            } else if (completedReps > 0) {
                badgeClass += ' in-progress';
            }

            itemEl.innerHTML = `
                <div class="item-main">
                    <span class="item-label">${item.label || item.prompt_text}</span>
                    ${item.categoria ? `<span class="item-category">${item.categoria}</span>` : ''}
                </div>
                <span class="${badgeClass}">${badgeText}</span>
            `;

            itemEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectWord(item);
                this.closeCombobox();
            });

            this.comboboxOptionsList.appendChild(itemEl);
        });
    }

    selectWord(item) {
        if (!item) return;
        this.currentWord = item;
        const id = item.label_id || item.prompt_id;
        if (id) {
            localStorage.setItem('lsp_last_selected_label_id', id);
        }

        if (this.wordSearchInput) {
            this.wordSearchInput.value = item.label || item.prompt_text || '';
        }
        if (this.wordSelect) {
            this.wordSelect.value = id;
        }

        this.updatePromptUI();
        this.loadRepetitionProgress();
        this.updateRepetitionUI();
    }

    initSearchLogic() {
        // Wrapper for compatibility with any external calls
        if (this.wordSearch) {
            this.wordSearch.oninput = () => {
                if (this.wordSearchInput) {
                    this.wordSearchInput.value = this.wordSearch.value;
                }
                this.renderComboboxOptions(this.wordSearch.value);
            };
        }
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
            this.durationLimitNote.textContent = `Límite sugerido: ${limits[this.modeSelect.value] || '2-4s'}`;
        }
    }

    loadRepetitionProgress() {
        if (!this.currentWord) return;
        const id = this.currentWord.label_id || this.currentWord.prompt_id;
        const completed = this.participantProgress[id] || 0;
        this.currentRepetition = Math.min(completed + 1, 10);
    }

    saveRepetitionProgress() {
        // El progreso válido vive en Google Sheets, no solo en el navegador.
    }

    // ========== PARTICIPANT AUTHENTICATION & SESSION ==========
    showAuthStep(step) {
        if (this.authStepEmail) this.authStepEmail.classList.add('hidden');
        if (this.authStepNewUser) this.authStepNewUser.classList.add('hidden');
        if (this.authStepReturningUser) this.authStepReturningUser.classList.add('hidden');
        if (this.authStepResetPassword) this.authStepResetPassword.classList.add('hidden');

        if (step === 'email') {
            if (this.authStepEmail) this.authStepEmail.classList.remove('hidden');
            if (this.authView) this.authView.classList.remove('hidden');
            if (this.appContainer) this.appContainer.classList.add('hidden');
            if (this.landing) this.landing.classList.add('hidden');
        } else if (step === 'new') {
            if (this.authStepNewUser) this.authStepNewUser.classList.remove('hidden');
            if (this.authView) this.authView.classList.remove('hidden');
            if (this.appContainer) this.appContainer.classList.add('hidden');
            if (this.landing) this.landing.classList.add('hidden');
        } else if (step === 'returning') {
            if (this.authStepReturningUser) this.authStepReturningUser.classList.remove('hidden');
            if (this.authView) this.authView.classList.remove('hidden');
            if (this.appContainer) this.appContainer.classList.add('hidden');
            if (this.landing) this.landing.classList.add('hidden');
        } else if (step === 'reset') {
            if (this.authStepResetPassword) this.authStepResetPassword.classList.remove('hidden');
            if (this.authView) this.authView.classList.remove('hidden');
            if (this.appContainer) this.appContainer.classList.add('hidden');
            if (this.landing) this.landing.classList.add('hidden');
        } else if (step === 'active') {
            if (this.authView) this.authView.classList.add('hidden');
            if (this.landing) this.landing.classList.add('hidden');
            if (this.appContainer) this.appContainer.classList.remove('hidden');
            if (this.activeSessionCard) this.activeSessionCard.classList.remove('hidden');
            if (this.wordSelectorCard) this.wordSelectorCard.classList.remove('hidden');
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

                    if (res.must_change_password && res.has_profile) {
                        // Usuario registrado existente con clave restablecida por Admin:
                        // debe ingresar el código generado por el admin y definir su nueva contraseña
                        if (this.resetUserEmail) this.resetUserEmail.textContent = email;
                        if (this.authResetTempCode) this.authResetTempCode.value = "";
                        if (this.authResetNewPassword) this.authResetNewPassword.value = "";
                        if (this.authResetConfirmPassword) this.authResetConfirmPassword.value = "";
                        this.showAuthStep('reset');
                        if (this.authResetTempCode) this.authResetTempCode.focus();
                    } else if (res.is_new || res.must_change_password) {
                        // Usuario nuevo o primera vez: código autogenerado visible en pantalla
                        if (this.displayTempCode) this.displayTempCode.textContent = res.temp_code || "LSP-XXXX";
                        if (this.authTempCode) this.authTempCode.value = res.temp_code || "";
                        if (res.alias && this.participantAlias) this.participantAlias.value = res.alias;
                        this.showAuthStep('new');
                        if (this.authNewPassword) this.authNewPassword.focus();
                    } else {
                        // Usuario recurrente con contraseña activa
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
        if (this.btnBackToEmailReset) {
            this.btnBackToEmailReset.addEventListener('click', () => this.showAuthStep('email'));
        }

        if (this.btnForgotPwdHelp) {
            this.btnForgotPwdHelp.addEventListener('click', () => {
                alert("Si olvidaste tu contraseña, comunícate con el administrador del proyecto para que te genere un código temporal de acceso (LSP-XXXX).\n\nUna vez que el admin te lo envíe, ingresa tu correo y podrás usar ese código para definir tu nueva contraseña.");
            });
        }

        if (this.btnCompleteResetPassword) {
            this.btnCompleteResetPassword.addEventListener('click', async () => {
                const email = (this.authEmail.value || "").trim().toLowerCase();
                const tempCode = (this.authResetTempCode.value || "").trim().toUpperCase();
                const newPass = (this.authResetNewPassword.value || "").trim();
                const confirmPass = (this.authResetConfirmPassword.value || "").trim();

                if (!tempCode) {
                    return this._alert("Por favor ingresa el código temporal proporcionado por el administrador.");
                }
                if (!newPass || newPass.length < 4) {
                    return this._alert("La nueva contraseña debe tener al menos 4 caracteres.");
                }
                if (newPass !== confirmPass) {
                    return this._alert("Las contraseñas no coinciden. Por favor verifícalas.");
                }

                try {
                    this.btnCompleteResetPassword.disabled = true;
                    this.btnCompleteResetPassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
                    
                    const session = await this.authHandlers.completeRegistration(email, tempCode, newPass, {});
                    this.activateParticipantSession(session, session.participant || {});
                } catch (err) {
                    this._alert(err.message || "Error al restablecer contraseña: " + err.message);
                } finally {
                    this.btnCompleteResetPassword.disabled = false;
                    this.btnCompleteResetPassword.innerHTML = '<i class="fa-solid fa-lock-open"></i> Guardar Contraseña e Ingresar';
                }
            });
        }

        if (this.btnCompleteRegistration) {
            this.btnCompleteRegistration.addEventListener('click', async () => {
                const email = (this.authEmail ? this.authEmail.value : "").trim().toLowerCase();
                const tempCode = (this.authTempCode ? this.authTempCode.value : "").trim();
                const newPass = (this.authNewPassword ? this.authNewPassword.value : "").trim();
                const confirmPass = (this.authConfirmPassword ? this.authConfirmPassword.value : "").trim();

                document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

                if (!newPass || newPass.length < 4) {
                    if (this.authNewPassword) {
                        this.authNewPassword.classList.add('field-error');
                        this.authNewPassword.focus();
                    }
                    return this._alert("La contraseña debe tener al menos 4 caracteres.");
                }
                if (newPass !== confirmPass) {
                    if (this.authConfirmPassword) {
                        this.authConfirmPassword.classList.add('field-error');
                        this.authConfirmPassword.focus();
                    }
                    return this._alert("Las contraseñas no coinciden. Por favor verifícalas.");
                }
                if (!this.validateParticipantForm()) return;

                try {
                    this.btnCompleteRegistration.disabled = true;
                    this.btnCompleteRegistration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Activando cuenta...';
                    
                    const profile = this.readParticipantForm();
                    profile.email = email;
                    const session = await this.authHandlers.completeRegistration(email, tempCode, newPass, profile);
                    this.activateParticipantSession(session, profile);
                } catch (err) {
                    console.error("Error en registro:", err);
                    this._alert(err.message || "Error al completar registro.");
                } finally {
                    this.btnCompleteRegistration.disabled = false;
                    this.btnCompleteRegistration.innerHTML = '<i class="fa-solid fa-user-check"></i> Activar Cuenta y Comenzar';
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

        if (this.btnBackToLandingFromAuth) {
            this.btnBackToLandingFromAuth.addEventListener('click', () => {
                if (this.authView) this.authView.classList.add('hidden');
                if (this.landing) this.landing.classList.remove('hidden');
            });
        }

        if (this.btnLogout) {
            this.btnLogout.addEventListener('click', () => {
                if (confirm("¿Deseas cerrar tu sesión actual?")) {
                    localStorage.removeItem('lsp_user_session');
                    localStorage.removeItem('lsp_participant_profile');
                    localStorage.removeItem('lsp_participant_uuid');
                    localStorage.removeItem('lsp_participant_resume_code');
                    localStorage.removeItem('lsp_last_selected_label_id');
                    if (this.authHandlers && this.authHandlers.onLogout) {
                        this.authHandlers.onLogout();
                    }
                    this.participantData = null;
                    this.participantProgress = {};
                    if (this.appContainer) this.appContainer.classList.add('hidden');
                    if (this.authView) this.authView.classList.add('hidden');
                    if (this.landing) this.landing.classList.remove('hidden');
                    if (window.location.hash && window.location.hash !== '') {
                        window.location.hash = '';
                    }
                }
            });
        }

        this.initPasswordToggles();
        this.initPasswordMatchFeedback();
    }

    initPasswordToggles() {
        const toggles = [
            { btnId: 'btnToggleNewPwd', inputId: 'authNewPassword' },
            { btnId: 'btnToggleConfirmPwd', inputId: 'authConfirmPassword' },
            { btnId: 'btnToggleLoginPwd', inputId: 'authLoginPassword' },
            { btnId: 'btnToggleResetNewPwd', inputId: 'authResetNewPassword' },
            { btnId: 'btnToggleResetConfirmPwd', inputId: 'authResetConfirmPassword' }
        ];

        toggles.forEach(({ btnId, inputId }) => {
            const btn = document.getElementById(btnId);
            const input = document.getElementById(inputId);
            if (!btn || !input) return;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
                }
            });
        });
    }

    initPasswordMatchFeedback() {
        if (!this.authNewPassword || !this.authConfirmPassword || !this.passwordMatchStatus) return;

        const updateStatus = () => {
            const p1 = this.authNewPassword.value;
            const p2 = this.authConfirmPassword.value;

            if (!p1 && !p2) {
                this.passwordMatchStatus.className = 'password-match-hint hidden';
                this.passwordMatchStatus.innerHTML = '';
                return;
            }

            if (p1 && p2) {
                if (p1 === p2) {
                    if (p1.length >= 4) {
                        this.passwordMatchStatus.className = 'password-match-hint match-success';
                        this.passwordMatchStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>✓ Las contraseñas coinciden correctamente</span>';
                        this.authNewPassword.classList.remove('field-error');
                        this.authConfirmPassword.classList.remove('field-error');
                    } else {
                        this.passwordMatchStatus.className = 'password-match-hint match-warning';
                        this.passwordMatchStatus.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span>Mínimo 4 caracteres requeridos</span>';
                    }
                } else {
                    this.passwordMatchStatus.className = 'password-match-hint match-error';
                    this.passwordMatchStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <span>Las contraseñas no coinciden aún</span>';
                }
            } else if (p1 && !p2) {
                if (p1.length < 4) {
                    this.passwordMatchStatus.className = 'password-match-hint match-warning';
                    this.passwordMatchStatus.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span>Mínimo 4 caracteres requeridos</span>';
                } else {
                    this.passwordMatchStatus.className = 'password-match-hint hidden';
                }
            } else {
                this.passwordMatchStatus.className = 'password-match-hint hidden';
            }
        };

        this.authNewPassword.addEventListener('input', updateStatus);
        this.authConfirmPassword.addEventListener('input', updateStatus);
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

        // Actualizar combobox con el progreso del usuario
        this.renderComboboxOptions(this.wordSearchInput ? this.wordSearchInput.value.trim() : '');
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
        if (!this.vocab || !this.vocab.length) return;
        const savedLabelId = localStorage.getItem('lsp_last_selected_label_id');
        let item = null;

        // 1. Prioridad: la seña en la que el usuario se quedó en este navegador (< 10 repeticiones)
        if (savedLabelId) {
            item = this.vocab.find(v => (v.label_id === savedLabelId || v.prompt_id === savedLabelId) && (this.participantProgress[v.label_id] || 0) < 10);
        }

        // 2. Si no o ya se completó, usar la última seña registrada del backend
        if (!item && this.lastLabelId) {
            item = this.vocab.find(v => v.label_id === this.lastLabelId && (this.participantProgress[v.label_id] || 0) < 10);
        }

        // 3. Si no, buscar la primera seña pendiente en el vocabulario
        if (!item) {
            item = this.vocab.find(v => (this.participantProgress[v.label_id] || 0) < 10);
        }

        if (!item) {
            if (this.wordSearchInput) this.wordSearchInput.value = "¡Todas las señas completadas!";
            if (this.wordSelect) this.wordSelect.value = "";
            this.currentWord = null;
            this.promptInstructions.classList.remove('hidden');
            this.promptTextDisplay.textContent = "¡Completaste las 40 señas y sus 10 repeticiones!";
            this.durationLimitNote.textContent = "Gracias por completar el protocolo de captura.";
            if (this.repetitionCounterText) {
                this.repetitionCounterText.textContent = "10 de 10 completadas";
                this.repetitionCounterText.style.color = "var(--success)";
            }
            return;
        }
        this.selectWord(item);
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
        // Sin sesión activa previa: mostrar portada limpia
        if (this.authView) this.authView.classList.add('hidden');
        if (this.appContainer) this.appContainer.classList.add('hidden');
        if (this.landing) this.landing.classList.remove('hidden');
    }

    saveParticipantToStorage() {
        if (this.participantData) {
            localStorage.setItem('lsp_participant_profile', JSON.stringify(this.participantData));
        }
    }

    validateParticipantForm() {
        document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

        const checks = [
            { el: this.participantAlias, name: "Nombre o Alias para el estudio" },
            { el: this.participantAge, name: "Rango de Edad" },
            { el: this.participantRegion, name: "Región de residencia" },
            { el: this.participantHand, name: "Mano Dominante" },
            { el: this.participantLevel, name: "Nivel en Lengua LSP" },
            { el: this.participantType, name: "Tipo de Participante" }
        ];

        for (const item of checks) {
            if (!item.el || !item.el.value || !item.el.value.trim()) {
                if (item.el) {
                    item.el.classList.add('field-error');
                    item.el.focus();
                    item.el.addEventListener('change', () => item.el.classList.remove('field-error'), { once: true });
                    item.el.addEventListener('input', () => item.el.classList.remove('field-error'), { once: true });
                }
                return this._alert(`El campo "${item.name}" es obligatorio. Por favor selecciónalo o complétalo para continuar.`);
            }
        }
        
        // Consent
        if (!this.consentCheckboxes.research.checked || 
            !this.consentCheckboxes.storage.checked || 
            !this.consentCheckboxes.training.checked || 
            !this.consentCheckboxes.age.checked) {
            return this._alert("Debes marcar y aceptar todos los puntos de consentimiento ético informado.");
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

    resetCameraState() {
        if (this.btnStartCamera) {
            this.btnStartCamera.classList.remove('hidden');
            this.btnStartCamera.disabled = false;
            this.btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
        }
        if (this.btnStartCameraMobile) {
            this.btnStartCameraMobile.classList.remove('hidden');
            this.btnStartCameraMobile.disabled = false;
            this.btnStartCameraMobile.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Cámara';
        }
        if (this.btnRecord) {
            this.btnRecord.classList.remove('hidden');
            this.btnRecord.disabled = true;
        }
        if (this.btnStop) {
            this.btnStop.classList.add('hidden');
        }
        if (this.btnRecordMobile) {
            this.btnRecordMobile.classList.add('hidden');
            this.btnRecordMobile.disabled = true;
            this.btnRecordMobile.innerHTML = '<i class="fa-solid fa-circle"></i> Grabar';
            this.btnRecordMobile.classList.remove('btn-stop');
            this.btnRecordMobile.classList.add('btn-record');
        }
        if (this.btnSwitchCamera) {
            this.btnSwitchCamera.classList.add('hidden');
        }
        if (this.recordingBadge) {
            this.recordingBadge.classList.add('hidden');
        }
        if (this.palabraOverlay) {
            this.palabraOverlay.classList.add('hidden');
        }
        if (this.webcam) {
            this.webcam.srcObject = null;
        }
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

        // Show Review Overlay
        this.reviewOverlay.classList.remove('hidden');

        // Solo mostrar panel de anotación in-situ si el usuario activo es administrador
        if (this.participantData && this.participantData.role === 'admin') {
            this.annotationPanel.classList.remove('hidden');
            this.producedTextEs.value = "";
            this.producedTextEs.placeholder = `Sugerido: ${this.currentWord.prompt_text || this.currentWord.label || ""}`;
        } else {
            this.annotationPanel.classList.add('hidden');
        }
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
        if (!this.currentWord) return;
        const id = this.currentWord.label_id || this.currentWord.prompt_id;
        const completed = this.participantProgress[id] || 0;

        if (this.repetitionCounterText) {
            if (completed >= 10) {
                this.repetitionCounterText.textContent = "10 de 10 (¡Completada!)";
                this.repetitionCounterText.style.color = "var(--success)";
            } else {
                this.repetitionCounterText.textContent = `Repetición ${this.currentRepetition} de 10`;
                this.repetitionCounterText.style.color = "var(--primary)";
            }
        }

        this.repetitionCircles.forEach(c => {
            const rep = parseInt(c.dataset.rep);
            c.className = 'circle';
            if (rep <= completed) {
                c.classList.add('completed');
            }
            if (rep === this.currentRepetition && completed < 10) {
                c.classList.add('active');
            }
        });

        if (completed >= 10 && this.durationLimitNote) {
            this.durationLimitNote.textContent = "✓ Seña completada (10 de 10 repeticiones guardadas). Puedes continuar con otra seña.";
        }
    }

    setUploadingState() {
        this.reviewOverlay.classList.add('hidden');
        this.uploadStatusUI.classList.remove('hidden');
        this.uploadProgressBar.style.width = '50%';
        if (this.uploadStatusMobile) this.uploadStatusMobile.classList.remove('hidden');
        if (this.uploadProgressBarMobile) this.uploadProgressBarMobile.style.width = '50%';
    }

    setFinishedState(progress) {
        this.uploadProgressBar.style.width = '100%';
        this.uploadStatusUI.querySelector('.status-text').textContent = "¡Subida exitosa!";
        if (this.uploadProgressBarMobile) this.uploadProgressBarMobile.style.width = '100%';
        
        this.applyProgress(progress || {});

        const savedSession = localStorage.getItem('lsp_user_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                parsed.progress = progress || { by_label: this.participantProgress, last_label_id: this.lastLabelId };
                localStorage.setItem('lsp_user_session', JSON.stringify(parsed));
            } catch (e) {
                console.warn("Error guardando progreso en sesión:", e);
            }
        }

        // Actualizar progreso para la seña actual o avanzar si ya completó las 10
        if (this.currentWord) {
            const id = this.currentWord.label_id || this.currentWord.prompt_id;
            const completed = this.participantProgress[id] || 0;
            if (completed >= 10) {
                this.updateRepetitionUI();
                // Buscar siguiente palabra que no haya completado 10 repeticiones
                const nextItem = this.vocab.find(v => (this.participantProgress[v.label_id] || 0) < 10);
                if (nextItem) {
                    setTimeout(() => {
                        this.selectWord(nextItem);
                    }, 1400);
                }
            } else {
                this.loadRepetitionProgress();
                this.updateRepetitionUI();
            }
        } else {
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        }

        // Actualizar las insignias de progreso en el desplegable
        this.renderComboboxOptions(this.wordSearchInput ? this.wordSearchInput.value.trim() : '');

        this.hidePreview();

        setTimeout(() => {
            this.uploadStatusUI.classList.add('hidden');
            this.uploadStatusUI.querySelector('.status-text').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo a Drive...';
            if (this.uploadStatusMobile) this.uploadStatusMobile.classList.add('hidden');
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
            produced_text_es: (this.producedTextEs && this.producedTextEs.value.trim()) 
                ? this.producedTextEs.value.trim() 
                : (w.prompt_text || w.label || ""),
            produced_text_es_normalized: ((this.producedTextEs && this.producedTextEs.value.trim()) 
                ? this.producedTextEs.value.trim() 
                : (w.prompt_text || w.label || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), 
            gloss_reference: w.gloss_reference || "",
            annotation_status: (this.participantData && this.participantData.role === 'admin') ? "admin_annotated" : "pending_review",
            split: "unassigned",
            
            // Quality Flags (In-situ scientific annotation)
            failed_capture: (this.flagIncomplete && this.participantData && this.participantData.role === 'admin') ? this.flagIncomplete.checked : false,
            hands_visible: this.handsVisible ? this.handsVisible.checked : true,
            face_visible: this.faceVisible ? this.faceVisible.checked : true,
            body_visible: this.bodyVisible ? this.bodyVisible.checked : true,
            occlusion_level: this.occlusionLevel ? this.occlusionLevel.value : "low",
            linguistic_acceptability: "pending_review",
            prompt_adherence: this.promptAdherence ? this.promptAdherence.checked : true,
            
            // Technical
            app_version: "2.1.0-scientific-ready",
            dataset_phase: "1-B"
        };
    }
}
