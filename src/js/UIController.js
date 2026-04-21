export class UIController {
    constructor() {
        // --- Participant Form ---
        this.participantCard = document.getElementById('participantCard');
        this.participantAlias = document.getElementById('participantAlias');
        this.participantAge = document.getElementById('participantAge');
        this.participantRegion = document.getElementById('participantRegion');
        this.participantHand = document.getElementById('participantHand');
        this.participantLevel = document.getElementById('participantLevel');
        this.participantType = document.getElementById('participantType');
        this.btnSaveParticipant = document.getElementById('btnSaveParticipant');
        this.participantSavedMsg = document.getElementById('participantSavedMsg');

        // --- Capture Mode ---
        this.modeSelectorCard = document.getElementById('modeSelectorCard');
        this.modeSelect = document.getElementById('modeSelect');
        this.modeDescription = document.getElementById('modeDescription');
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
        this.repetitionContainer = document.getElementById('repetitionContainer');
        this.repetitionCircles = document.querySelectorAll('.circle');
        this.promptInstructions = document.getElementById('promptInstructions');
        this.promptTextDisplay = document.getElementById('promptTextDisplay');
        this.durationLimitNote = document.getElementById('durationLimitNote');

        // --- Video & Controls ---
        this.webcam = document.getElementById('webcam');
        this.previewPlayer = document.getElementById('previewPlayer');
        this.btnStartCamera = document.getElementById('btnStartCamera');
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');
        this.btnRecordMobile = document.getElementById('btnRecordMobile');
        
        // --- Review & Status ---
        this.reviewOverlay = document.getElementById('reviewOverlay');
        this.btnAccept = document.getElementById('btnAccept');
        this.btnRepeat = document.getElementById('btnRepeat');
        this.techStats = document.getElementById('techStats');
        this.statRes = document.getElementById('statRes');
        this.statDur = document.getElementById('statDur');
        this.qualityFlagContainer = document.getElementById('qualityFlagContainer');
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

        this.initParticipantLogic();
        this.initModeLogic();
        this.initReviewButtons();
        this.initProtocol();
        
        // Load existing participant if available
        this.loadParticipantFromStorage();
    }

    // ========== DATA & VOCABULARY ==========
    async loadVocab() {
        const mode = this.modeSelect.value;
        let file = 'lexicon_isolated_v1.json';
        
        switch(mode) {
            case 'expression': file = 'expressions_v1.json'; break;
            case 'template': file = 'templates_v1.json'; break;
            case 'continuous': file = 'continuous_prompts_v1.json'; break;
        }

        try {
            const response = await fetch(`./src/data/${file}`);
            this.vocab = await response.json();
            this.updateSelectorUI();
        } catch (error) {
            console.error("Error loading vocab:", error);
        }
    }

    initModeLogic() {
        const descriptions = {
            isolated: "Captura de señas individuales, una por clip. (180-250 labels)",
            expression: "Secuencias cortas que funcionan casi como unidad. (30-60 expresiones)",
            template: "Plantillas estructuradas (Ej: YO + NECESITAR + AYUDA).",
            continuous: " Signing continuo controlado. Oraciones completas o pequeños discursos."
        };

        this.modeSelect.addEventListener('change', () => {
            this.modeDescription.textContent = descriptions[this.modeSelect.value];
            this.loadVocab();
        });
    }

    updateSelectorUI() {
        const mode = this.modeSelect.value;
        this.categorySelect.innerHTML = '<option value="">Selecciona Categoría</option>';
        this.wordSelect.innerHTML = '<option value="">Selecciona Item</option>';
        this.wordSelect.disabled = true;

        if (mode === 'continuous') {
            this.selectorTitle.textContent = "Prompt Continuo";
            this.categorySelect.classList.add('hidden');
            this.repetitionContainer.classList.add('hidden');
            this.populateContinuousList();
        } else {
            this.selectorTitle.textContent = mode === 'template' ? "Secuencia a Grabar" : "Palabra a Grabar";
            this.categorySelect.classList.remove('hidden');
            this.repetitionContainer.classList.remove('hidden');
            this.populateCategories();
        }
    }

    populateCategories() {
        const categories = [...new Set(this.vocab.map(v => v.categoria))];
        categories.forEach(cat => {
            if (!cat) return;
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            this.categorySelect.appendChild(opt);
        });

        this.categorySelect.addEventListener('change', () => {
            this.populateWords(this.categorySelect.value);
        });

        this.wordSelect.addEventListener('change', () => {
            this.currentWord = this.vocab.find(v => (v.label_id || v.prompt_id) === this.wordSelect.value);
            this.updatePromptInfo();
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        });
    }

    populateWords(category) {
        this.wordSelect.innerHTML = '<option value="">Selecciona Item</option>';
        if (!category) {
            this.wordSelect.disabled = true;
            return;
        }

        const filtered = this.vocab.filter(v => v.categoria === category && v.activo);
        filtered.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.label_id || v.prompt_id;
            opt.textContent = v.label || v.prompt_text;
            this.wordSelect.appendChild(opt);
        });
        this.wordSelect.disabled = false;
    }

    populateContinuousList() {
        this.wordSelect.innerHTML = '<option value="">Selecciona Prompt</option>';
        this.vocab.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.prompt_id;
            opt.textContent = v.prompt_text.length > 40 ? v.prompt_text.substring(0, 40) + '...' : v.prompt_text;
            this.wordSelect.appendChild(opt);
        });
        this.wordSelect.disabled = false;
        
        this.wordSelect.addEventListener('change', () => {
             this.currentWord = this.vocab.find(v => v.prompt_id === this.wordSelect.value);
             this.updatePromptInfo();
        });
    }

    updatePromptInfo() {
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
        const participantUuid = localStorage.getItem('lsp_participant_uuid');
        if (!participantUuid) {
            this.currentRepetition = 1;
            return;
        }

        const key = `lsp_rep_${participantUuid}_${this.currentWord.label_id}`;
        const saved = localStorage.getItem(key);
        this.currentRepetition = saved ? parseInt(saved) : 1;
        
        // If they already did 5, but didn't switch word, keep it at 5 or handle reset?
        // Let's stick to the current logic: if they finished 5, it stays at 1? 
        // Actually, let's allow them to see it's 6/5 (meaning all done) or cap it.
        if (this.currentRepetition > 5) {
             // Word fully recorded.
        }
    }

    saveRepetitionProgress() {
        if (!this.currentWord) return;
        const participantUuid = localStorage.getItem('lsp_participant_uuid');
        if (!participantUuid) return;

        const key = `lsp_rep_${participantUuid}_${this.currentWord.label_id}`;
        localStorage.setItem(key, this.currentRepetition);
    }

    // ========== PARTICIPANT & CONSENT ==========
    initParticipantLogic() {
        this.btnSaveParticipant.addEventListener('click', () => {
            if (this.validateParticipantForm()) {
                this.lockParticipantForm();
                this.saveParticipantToStorage();
            }
        });
    }

    loadParticipantFromStorage() {
        const saved = localStorage.getItem('lsp_participant_profile');
        if (saved) {
            const p = JSON.parse(saved);
            this.participantAlias.value = p.alias;
            this.participantAge.value = p.age;
            this.participantRegion.value = p.region;
            this.participantHand.value = p.hand;
            this.participantLevel.value = p.level;
            this.participantType.value = p.type;
            
            // Re-check consent if they previously accepted? 
            // Better to make them check consent every fresh session or remember it?
            // User requested robust progress, so let's remember consent if saved.
            Object.values(this.consentCheckboxes).forEach(cb => cb.checked = true);
            
            this.lockParticipantForm();
        }
    }

    saveParticipantToStorage() {
        localStorage.setItem('lsp_participant_profile', JSON.stringify(this.participantData));
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
            return this._alert("Debes aceptar todos los puntos de consentimiento");
        }
        return true;
    }

    lockParticipantForm() {
        this.participantData = {
            alias: this.participantAlias.value.trim().toUpperCase(),
            age: this.participantAge.value,
            region: this.participantRegion.value,
            hand: this.participantHand.value,
            level: this.participantLevel.value,
            type: this.participantType.value
        };

        // Disable all inputs
        [this.participantAlias, this.participantAge, this.participantRegion, 
         this.participantHand, this.participantLevel, this.participantType, 
         this.btnSaveParticipant, ...Object.values(this.consentCheckboxes)].forEach(el => el.disabled = true);

        this.participantSavedMsg.classList.remove('hidden');
        this.modeSelectorCard.classList.remove('hidden');
        this.wordSelectorCard.classList.remove('hidden');
       if (!localStorage.getItem('lsp_participant_profile')) {
            this.protocolOverlay.classList.remove('hidden');
        }
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
        this.btnRecord.disabled = false;
        this.btnRecordMobile.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');
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

        // Show tech stats
        this.statRes.innerHTML = `<i class="fa-solid fa-expand"></i> ${stats.width}x${stats.height}`;
        this.statDur.innerHTML = `<i class="fa-solid fa-clock"></i> ${stats.duration.toFixed(1)}s`;
        this.techStats.classList.remove('hidden');

        // Setup Preview Player
        const url = URL.createObjectURL(videoBlob);
        this.previewPlayer.src = url;
        this.previewPlayer.classList.remove('hidden');
        this.webcam.classList.add('hidden');

        // Show Review Overlay
        this.reviewOverlay.classList.remove('hidden');
        this.qualityFlagContainer.classList.remove('hidden');
    }

    hidePreview() {
        this.reviewOverlay.classList.add('hidden');
        this.qualityFlagContainer.classList.add('hidden');
        this.flagIncomplete.checked = false;
        this.previewPlayer.classList.add('hidden');
        this.previewPlayer.src = "";
        this.webcam.classList.remove('hidden');
        this.techStats.classList.add('hidden');
        
        // Restore record buttons
        this.btnRecord.disabled = false;
        this.btnRecordMobile.classList.remove('hidden');
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
    }

    setUploadingState() {
        this.reviewOverlay.classList.add('hidden');
        this.uploadStatusUI.classList.remove('hidden');
        this.uploadProgressBar.style.width = '50%';
        this.uploadStatusMobile.classList.remove('hidden');
        this.uploadProgressBarMobile.style.width = '50%';
    }

    setFinishedState() {
        this.uploadProgressBar.style.width = '100%';
        this.uploadStatusUI.querySelector('.status-text').textContent = "¡Subida exitosa!";
        this.uploadProgressBarMobile.style.width = '100%';
        
        this.currentRepetition++;
        this.saveRepetitionProgress(); // Persist progress
        
        if (this.currentRepetition > 5) {
            this.currentRepetition = 1; 
            this.wordSelect.value = "";
            this.currentWord = null;
            this.promptInstructions.classList.add('hidden');
        }
        
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
        return {
            participant: this.participantData,
            capture_mode: mode,
            word: this.currentWord,
            prompt_id: this.currentWord.prompt_id || this.currentWord.label_id,
            prompt_text: this.currentWord.prompt_text || this.currentWord.label,
            expected_sequence: this.currentWord.expected_sequence || [],
            sequence_length: this.currentWord.expected_sequence ? this.currentWord.expected_sequence.length : 1,
            repetition: this.currentRepetition,
            failed_capture: this.flagIncomplete.checked,
            app_version: "1.0.0-phase1",
            dataset_phase: "1",
            consent_research: true,
            consent_training: true,
            consent_storage: true
        };
    }
}
