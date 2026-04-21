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

        // --- Consent ---
        this.consentCard = document.getElementById('consentCard');
        this.consentCheckboxes = {
            research: document.getElementById('consentResearch'),
            storage: document.getElementById('consentStorage'),
            training: document.getElementById('consentTraining'),
            age: document.getElementById('consentAge')
        };

        // --- Word Selector ---
        this.wordSelectorCard = document.getElementById('wordSelectorCard');
        this.categorySelect = document.getElementById('categorySelect');
        this.wordSelect = document.getElementById('wordSelect');
        this.repetitionCircles = document.querySelectorAll('.circle');

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

        // Initial State
        this.vocab = [];
        this.currentWord = null;
        this.currentRepetition = 1;
        this.participantData = null;

        this.initParticipantLogic();
        this.initReviewButtons();
        this.initProtocol();
        
        // Load existing participant if available
        this.loadParticipantFromStorage();
    }

    // ========== VOCABULARY ==========
    async loadVocab() {
        try {
            const response = await fetch('./src/data/vocab_v1.json');
            this.vocab = await response.json();
            this.populateCategories();
        } catch (error) {
            console.error("Error loading vocab:", error);
        }
    }

    populateCategories() {
        const categories = [...new Set(this.vocab.map(v => v.categoria))];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            this.categorySelect.appendChild(opt);
        });

        this.categorySelect.addEventListener('change', () => {
            this.populateWords(this.categorySelect.value);
        });

        this.wordSelect.addEventListener('change', () => {
            this.currentWord = this.vocab.find(v => v.label_id === this.wordSelect.value);
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        });
    }

    populateWords(category) {
        this.wordSelect.innerHTML = '<option value="">Selecciona Palabra</option>';
        if (!category) {
            this.wordSelect.disabled = true;
            return;
        }

        const filtered = this.vocab.filter(v => v.categoria === category && v.activo);
        filtered.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.label_id;
            opt.textContent = v.label;
            this.wordSelect.appendChild(opt);
        });
        this.wordSelect.disabled = false;
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
        this.wordSelectorCard.classList.remove('hidden');
        if (!localStorage.getItem('lsp_participant_profile')) {
            this.protocolOverlay.classList.remove('hidden');
        }
    }

    _alert(msg) {
        alert(msg);
        return false;
    }

    // ========== PROTOCOL ==========
    initProtocol() {
        this.btnCloseProtocol.addEventListener('click', () => {
            this.protocolOverlay.classList.add('hidden');
        });
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
        this.palabraOverlay.textContent = this.currentWord.label;
        this.palabraOverlay.classList.remove('hidden');
    }

    showPreview(videoBlob, stats) {
        // Reset states
        this.recordingBadge.classList.add('hidden');
        this.palabraOverlay.classList.add('hidden');
        
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
    }

    hidePreview() {
        this.reviewOverlay.classList.add('hidden');
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
            this.currentRepetition = 1; // Or handle as "done"
            this.wordSelect.value = "";
            this.currentWord = null;
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
        return {
            participant: this.participantData,
            word: this.currentWord,
            repetition: this.currentRepetition,
            consent_research: true,
            consent_training: true,
            consent_storage: true
        };
    }
}
