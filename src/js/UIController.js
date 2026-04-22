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
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');
        this.btnRecordMobile = document.getElementById('btnRecordMobile');
        
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

        this.initParticipantLogic();
        this.initModeLogic();
        this.initReviewButtons();
        this.initProtocol();
        this.initSearchLogic();
        
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
            opt.value = item[idKey];
            opt.textContent = item[textKey];
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
            this.currentWord = words.find(v => v.label_id === this.wordSelect.value);
            this.updatePromptUI();
            this.loadRepetitionProgress();
            this.updateRepetitionUI();
        };
    }

    populateContinuousList(items) {
        this.renderWordOptions(items, 'prompt_id', 'prompt_text');

        this.wordSelect.onchange = () => {
            const promptId = this.wordSelect.value;
            this.currentWord = items.find(i => i.prompt_id === promptId);
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
        const participantUuid = localStorage.getItem('lsp_participant_uuid');
        if (!participantUuid) {
            this.currentRepetition = 1;
            return;
        }

        const id = this.currentWord.label_id || this.currentWord.prompt_id;
        const key = `lsp_rep_${participantUuid}_${id}`;
        const saved = localStorage.getItem(key);
        this.currentRepetition = saved ? parseInt(saved) : 1;
        
        if (this.currentRepetition > 5) {
             // Word fully recorded.
        }
    }

    saveRepetitionProgress() {
        if (!this.currentWord) return;
        const participantUuid = localStorage.getItem('lsp_participant_uuid');
        if (!participantUuid) return;

        const id = this.currentWord.label_id || this.currentWord.prompt_id;
        const key = `lsp_rep_${participantUuid}_${id}`;
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
            
            // Ethics: Do NOT auto-check consents OR auto-lock. 
            // The user must manually confirm ethical adherence in each session.
            Object.values(this.consentCheckboxes).forEach(cb => cb.checked = false);
            
            // We populate the fields but leave the form UNLOCKED 
            // so they can check consents and click "Save" to activate the session.
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
        const p = this.participantData || {};
        const w = this.currentWord || {};

        return {
            // Participant (Flattened and Mapped for GAS)
            participant_id: localStorage.getItem('lsp_participant_uuid'),
            alias: p.alias,
            age: p.age,
            region: p.region,
            dominant_hand: p.hand,
            lsp_level: p.level,
            participant_type: p.type,

            // Ethical Consent (Actual states + explicit age consent)
            consent_research: this.consentCheckboxes.research.checked,
            consent_training: this.consentCheckboxes.training.checked,
            consent_storage: this.consentCheckboxes.storage.checked,
            consent_age: this.consentCheckboxes.age.checked,

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
