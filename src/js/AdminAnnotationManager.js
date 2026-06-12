/**
 * AdminAnnotationManager.js
 * Módulo para la gestión de anotación, validación y administración de usuarios (Fase II)
 */

export class AdminAnnotationManager {
    constructor() {
        this.gasUrl = import.meta.env.VITE_GAS_URL;
        this.container = document.getElementById("dashboardContainer");
        this.session = null;
        this.currentTab = "pending"; // pending, annotated, validated, users, export
        this.samples = [];
        this.selectedSample = null;
        this.isLoading = false;
    }

    /**
     * Inicializa el gestor, recuperando sesión si existe
     */
    init() {
        if (!this.container) return;

        // Recuperar sesión de localStorage
        const storedSession = localStorage.getItem("lsp_admin_session");
        if (storedSession) {
            try {
                this.session = JSON.parse(storedSession);
            } catch (e) {
                this.session = null;
            }
        }

        // Registrar escuchas para botones de apertura
        const btnAdmin = document.getElementById("btnAdminPanel");
        const btnAdminSidebar = document.getElementById("btnAdminPanelSidebar");

        if (btnAdmin) {
            btnAdmin.addEventListener("click", () => this.open());
        }
        if (btnAdminSidebar) {
            btnAdminSidebar.addEventListener("click", () => this.open());
        }

        // Renderizar pantalla inicial
        this.render();
    }

    /**
     * Abre el panel ocultando las demás secciones de la app
     */
    open() {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("appContainer").classList.add("hidden");
        this.container.classList.remove("hidden");
        this.render();
    }

    /**
     * Cierra el panel y vuelve al landing
     */
    close() {
        this.container.classList.add("hidden");
        document.getElementById("landing").classList.remove("hidden");
    }

    /**
     * Realiza peticiones POST a Google Apps Script usando text/plain para evitar problemas de preflight
     */
    async apiPost(action, body = {}) {
        if (!this.gasUrl) {
            throw new Error("URL de Google Apps Script no configurada.");
        }

        const email = body.email || (this.session ? this.session.email : "");
        const access_code = body.accessCode || body.access_code || (this.session ? this.session.accessCode : "");

        const payload = {
            action,
            email,
            access_code,
            ...body
        };

        const response = await fetch(this.gasUrl, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.status === "error") {
            throw new Error(result.message);
        }

        return result;
    }

    /**
     * Renderiza la interfaz actual según la sesión activa
     */
    render() {
        if (!this.session) {
            this.renderLogin();
        } else {
            this.renderDashboard();
        }
    }

    /**
     * Renderiza el formulario de inicio de sesión
     */
    renderLogin() {
        this.container.innerHTML = `
            <div class="login-wrapper">
                <div class="card glass login-card">
                    <div class="card-header">
                        <i class="fa-solid fa-user-shield"></i>
                        <h2>Acceso del Personal</h2>
                    </div>
                    <form id="loginForm" class="input-group">
                        <p class="login-instruction">Ingrese sus credenciales de revisor o administrador.</p>
                        
                        <div class="form-field">
                            <label for="loginEmail">Correo Electrónico</label>
                            <input type="email" id="loginEmail" required placeholder="ejemplo@correo.com" autocomplete="email">
                        </div>

                        <div class="form-field">
                            <label for="loginCode">Código de Acceso</label>
                            <input type="password" id="loginCode" required placeholder="••••••••" autocomplete="current-password">
                        </div>

                        <div id="loginError" class="error-msg hidden"></div>

                        <div class="login-actions">
                            <button type="button" class="btn btn-secondary" id="btnBackToLandingFromLogin">
                                <i class="fa-solid fa-arrow-left"></i> Volver
                            </button>
                            <button type="submit" class="btn btn-primary btn-glow" id="btnLoginSubmit">
                                <i class="fa-solid fa-right-to-bracket"></i> Ingresar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        const form = document.getElementById("loginForm");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const accessCode = document.getElementById("loginCode").value.trim();
            const errorDiv = document.getElementById("loginError");
            const btnSubmit = document.getElementById("btnLoginSubmit");

            try {
                errorDiv.classList.add("hidden");
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verificando...`;

                const res = await this.apiPost("login", { email, accessCode });
                
                // Guardar sesión
                this.session = {
                    email,
                    accessCode,
                    user: res.user
                };
                localStorage.setItem("lsp_admin_session", JSON.stringify(this.session));
                
                this.render();
            } catch (err) {
                errorDiv.textContent = err.message || "Credenciales inválidas.";
                errorDiv.classList.remove("hidden");
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Ingresar`;
            }
        });

        document.getElementById("btnBackToLandingFromLogin").addEventListener("click", () => {
            this.close();
        });
    }

    /**
     * Renderiza el panel principal con barra lateral y área de contenido
     */
    renderDashboard() {
        const isAdmin = this.session.user.role === "admin";
        
        this.container.innerHTML = `
            <div class="dashboard-wrapper">
                <!-- Barra superior de navegación y sesión -->
                <header class="dashboard-header glass">
                    <div class="db-brand">
                        <i class="fa-solid fa-hands-asl-interpreting"></i>
                        <div>
                            <h1>LSP DataControl</h1>
                            <p class="role-badge ${this.session.user.role}">
                                <i class="fa-solid ${isAdmin ? 'fa-key' : 'fa-pen-clip'}"></i> 
                                ${this.session.user.role.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    
                    <nav class="db-nav">
                        <button class="nav-tab ${this.currentTab === 'pending' ? 'active' : ''}" data-tab="pending">
                            <i class="fa-solid fa-clock"></i> Pendientes
                        </button>
                        <button class="nav-tab ${this.currentTab === 'annotated' ? 'active' : ''}" data-tab="annotated">
                            <i class="fa-solid fa-clipboard-check"></i> Anotadas
                        </button>
                        ${isAdmin ? `
                        <button class="nav-tab ${this.currentTab === 'validated' ? 'active' : ''}" data-tab="validated">
                            <i class="fa-solid fa-square-poll-vertical"></i> Validadas
                        </button>
                        <button class="nav-tab ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">
                            <i class="fa-solid fa-users-gear"></i> Usuarios
                        </button>
                        <button class="nav-tab ${this.currentTab === 'export' ? 'active' : ''}" data-tab="export">
                            <i class="fa-solid fa-file-export"></i> Exportar
                        </button>
                        ` : ''}
                    </nav>

                    <div class="db-user-actions">
                        <span class="user-alias"><i class="fa-solid fa-circle-user"></i> ${this.session.user.alias}</span>
                        <button class="btn btn-secondary" id="btnBackToGrabador" title="Ir al grabador de participante">
                            <i class="fa-solid fa-video"></i> Capturar
                        </button>
                        <button class="btn btn-danger" id="btnLogout">
                            <i class="fa-solid fa-right-from-bracket"></i> Salir
                        </button>
                    </div>
                </header>

                <!-- Panel central -->
                <main class="dashboard-body" id="dashboardBody">
                    <!-- Se llena dinámicamente según la pestaña -->
                </main>
            </div>
        `;

        // Event listeners
        const tabs = this.container.querySelectorAll(".nav-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                this.currentTab = tab.dataset.tab;
                this.selectedSample = null;
                this.renderDashboard();
            });
        });

        document.getElementById("btnLogout").addEventListener("click", () => {
            localStorage.removeItem("lsp_admin_session");
            this.session = null;
            this.render();
        });

        document.getElementById("btnBackToGrabador").addEventListener("click", () => {
            this.container.classList.add("hidden");
            document.getElementById("appContainer").classList.remove("hidden");
        });

        // Cargar contenido de la pestaña activa
        this.loadTabContent();
    }

    /**
     * Carga el contenido de la pestaña seleccionada
     */
    async loadTabContent() {
        const body = document.getElementById("dashboardBody");
        if (!body) return;

        if (this.currentTab === "users") {
            this.renderUsersTab(body);
            return;
        }

        if (this.currentTab === "export") {
            this.renderExportTab(body);
            return;
        }

        // Pestañas de colas de muestras
        this.renderQueueLayout(body);
    }

    /**
     * Renderiza el layout dividido de colas de muestras (Lista + Detalle)
     */
    async renderQueueLayout(body) {
        body.innerHTML = `
            <div class="queue-layout">
                <!-- Columna Izquierda: Listado -->
                <div class="queue-list-panel glass">
                    <div class="panel-header">
                        <h3>Muestras en Cola</h3>
                        <span class="queue-count" id="queueCount">0</span>
                    </div>
                    <div class="search-filter-container">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="sampleSearchInput" placeholder="Buscar por palabra, ID, participante...">
                    </div>
                    <div class="queue-scroll" id="queueList">
                        <div class="loading-state">
                            <i class="fa-solid fa-spinner fa-spin"></i> Cargando muestras...
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Detalle / Formulario -->
                <div class="queue-detail-panel glass" id="queueDetailPanel">
                    <div class="empty-state">
                        <i class="fa-solid fa-video"></i>
                        <h3>Seleccione una muestra</h3>
                        <p>Elija una tarjeta de la izquierda para comenzar el análisis.</p>
                    </div>
                </div>
            </div>
        `;

        // Obtener muestras del backend
        let action = "listPendingSamples";
        if (this.currentTab === "annotated") action = "listAnnotatedSamples";
        if (this.currentTab === "validated") action = "listValidatedSamples";

        try {
            this.isLoading = true;
            const res = await this.apiPost(action);
            this.samples = res.samples || [];
            
            this.renderQueueList();
            this.setupListFilters();
        } catch (e) {
            const listDiv = document.getElementById("queueList");
            if (listDiv) {
                listDiv.innerHTML = `
                    <div class="error-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>${e.message || "Error al cargar muestras."}</p>
                    </div>
                `;
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Filtra la lista en tiempo real
     */
    setupListFilters() {
        const searchInput = document.getElementById("sampleSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase().trim();
                this.renderQueueList(term);
            });
        }
    }

    /**
     * Renderiza las tarjetas de muestras
     */
    renderQueueList(searchTerm = "") {
        const listDiv = document.getElementById("queueList");
        const countSpan = document.getElementById("queueCount");
        if (!listDiv) return;

        const filtered = this.samples.filter(s => {
            if (!searchTerm) return true;
            return (
                (s.label || "").toLowerCase().includes(searchTerm) ||
                (s.sample_id || "").toLowerCase().includes(searchTerm) ||
                (s.participant_id || "").toLowerCase().includes(searchTerm) ||
                (s.capture_mode || "").toLowerCase().includes(searchTerm)
            );
        });

        countSpan.textContent = filtered.length;

        if (filtered.length === 0) {
            listDiv.innerHTML = `
                <div class="empty-state-small">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No hay muestras coincidentes.</p>
                </div>
            `;
            return;
        }

        listDiv.innerHTML = filtered.map(s => {
            const dateStr = s.capture_datetime ? new Date(s.capture_datetime).toLocaleDateString() : "--";
            const duration = s.duration_sec ? `${parseFloat(s.duration_sec).toFixed(1)}s` : "--";
            const statusClass = `status-${(s.annotation_status || "pendiente").trim().toLowerCase()}`;
            
            return `
                <div class="sample-card ${statusClass} ${this.selectedSample && this.selectedSample.sample.sample_id === s.sample_id ? 'selected' : ''}" data-id="${s.sample_id}">
                    <div class="card-top">
                        <span class="sample-id-badge">${s.sample_id}</span>
                        <span class="sample-status-label status-${(s.annotation_status || "pendiente").trim().toLowerCase()}">
                            ${(s.annotation_status || "PENDIENTE").toUpperCase()}
                        </span>
                    </div>
                    <div class="card-mid">
                        <h4 class="sample-word-title">${s.label}</h4>
                        <p class="sample-prompt-preview">${s.prompt_text || ""}</p>
                    </div>
                    <div class="card-bottom">
                        <span><i class="fa-solid fa-user"></i> ${s.participant_id}</span>
                        <span><i class="fa-solid fa-clock"></i> ${duration}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                    </div>
                </div>
            `;
        }).join("");

        // Agregar listeners
        const cards = listDiv.querySelectorAll(".sample-card");
        cards.forEach(card => {
            card.addEventListener("click", () => {
                const sampleId = card.dataset.id;
                this.selectSample(sampleId);
            });
        });
    }

    /**
     * Carga el detalle de una muestra seleccionada
     */
    async selectSample(sampleId) {
        const detailPanel = document.getElementById("queueDetailPanel");
        if (!detailPanel) return;

        detailPanel.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i> Cargando detalles...
            </div>
        `;

        try {
            const res = await this.apiPost("getSampleDetail", { sample_id: sampleId });
            this.selectedSample = res;
            this.renderSampleDetail();
            
            // Remarcar tarjeta seleccionada
            this.renderQueueList(document.getElementById("sampleSearchInput")?.value.toLowerCase().trim() || "");
        } catch (e) {
            detailPanel.innerHTML = `
                <div class="error-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudo cargar la muestra: ${e.message}</p>
                </div>
            `;
        }
    }

    /**
     * Renderiza el formulario y detalles en el panel derecho
     */
    renderSampleDetail() {
        const detailPanel = document.getElementById("queueDetailPanel");
        if (!detailPanel) return;

        const { sample, annotation } = this.selectedSample;
        const isAdmin = this.session.user.role === "admin";
        
        // Determinar formulario según modo de captura
        const isIsolated = sample.capture_mode === "isolated" || sample.capture_mode === "expression";
        
        // Datos actuales de anotación o valores por defecto
        const ann = annotation || {};
        
        const tipoMuestra = ann.tipo_muestra || sample.capture_mode;
        const glosaFinal = ann.glosa_final || sample.label || "";
        const secuenciaGlosas = ann.secuencia_glosas || "";
        const textoEsFinal = ann.texto_es_final || sample.produced_text_es || "";
        const intencion = ann.intencion_comunicativa || "saludo";
        const aceptabilidad = ann.aceptabilidad_linguistica || "aceptable";
        const calidad = ann.calidad_visual || "buena";
        const observacion = ann.observacion || "";
        const motivoRechazo = ann.motivo_rechazo || "";
        const adminNotes = ann.admin_notes || "";
        const split = sample.split || "unassigned";

        const statusClass = `status-${(sample.annotation_status || "pendiente").trim().toLowerCase()}`;

        detailPanel.innerHTML = `
            <div class="sample-detail-container ${statusClass}">
                <!-- Cabecera de Muestra -->
                <div class="detail-header">
                    <div>
                        <h2>Muestra ${sample.sample_id}</h2>
                        <div class="badge-row">
                            <span class="badge ${sample.capture_mode}">${sample.capture_mode.toUpperCase()}</span>
                            <span class="badge status-${(sample.annotation_status || "pendiente").trim().toLowerCase()}">
                                ${(sample.annotation_status || "pendiente").toUpperCase()}
                            </span>
                            <span class="badge split-${split}">${split.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-grid">
                    <!-- Sección Izquierda: Video y Metadatos de Captura -->
                    <div class="grid-col-video">
                        <div class="video-preview-wrapper">
                            <video src="${sample.video_url}" controls class="detail-video"></video>
                        </div>

                        <!-- Ficha Técnica de Captura -->
                        <div class="technical-specs card glass">
                            <h4>Ficha Técnica</h4>
                            <div class="spec-table">
                                <div class="spec-row"><span>Vocabulario:</span><strong>${sample.label}</strong></div>
                                <div class="spec-row"><span>Texto Guía:</span><strong>${sample.prompt_text || "--"}</strong></div>
                                <div class="spec-row"><span>Participante:</span><strong>${sample.participant_id}</strong></div>
                                <div class="spec-row"><span>Resolución:</span><strong>${sample.width ? `${sample.width}x${sample.height}` : "No registrada"}</strong></div>
                                <div class="spec-row"><span>Duración:</span><strong>${parseFloat(sample.duration_sec || 0).toFixed(2)}s</strong></div>
                                <div class="spec-row"><span>Repetición:</span><strong>#${sample.repetition || "1"}</strong></div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección Derecha: Ficha de Anotación Científica -->
                    <div class="grid-col-form">
                        <form id="annotationForm" class="annotation-form card glass">
                            <h3><i class="fa-solid fa-microscope"></i> Ficha de Anotación</h3>
                            
                            <div class="form-field">
                                <label for="annTipo">Tipo de Muestra</label>
                                <select id="annTipo">
                                    <option value="aislada" ${tipoMuestra === 'aislada' ? 'selected' : ''}>Aislada (Léxico)</option>
                                    <option value="expresion" ${tipoMuestra === 'expresion' ? 'selected' : ''}>Expresión Fija</option>
                                    <option value="plantilla" ${tipoMuestra === 'plantilla' ? 'selected' : ''}>Plantilla Gramatical</option>
                                    <option value="continua" ${tipoMuestra === 'continua' ? 'selected' : ''}>Señas Continuas</option>
                                </select>
                            </div>

                            <!-- Campos condicionales según tipo de muestra (aislada vs continua) -->
                            <div id="glosaFinalContainer" class="form-field ${!isIsolated ? 'hidden' : ''}">
                                <label for="annGlosaFinal">Glosa Unificada (Obligatorio en Aisladas)</label>
                                <input type="text" id="annGlosaFinal" placeholder="Ej: HOLA, GRACIAS" value="${glosaFinal}">
                            </div>

                            <div id="secuenciaGlosasContainer" class="form-field ${isIsolated ? 'hidden' : ''}">
                                <label for="annSecuenciaGlosas">Secuencia de Glosas (Obligatorio en Continuas)</label>
                                <input type="text" id="annSecuenciaGlosas" placeholder="Ej: YO COMPRAR MANZANA TRES" value="${secuenciaGlosas}">
                            </div>

                            <div class="form-field">
                                <label for="annTextoEsFinal">Traducción Final al Español (Obligatorio)</label>
                                <input type="text" id="annTextoEsFinal" placeholder="Traducción fluida de la muestra" value="${textoEsFinal}">
                            </div>

                            <div class="form-row-grid">
                                <div class="form-field">
                                    <label for="annIntencion">Intención</label>
                                    <select id="annIntencion">
                                        <option value="saludo" ${intencion === 'saludo' ? 'selected' : ''}>Saludo</option>
                                        <option value="despedida" ${intencion === 'despedida' ? 'selected' : ''}>Despedida</option>
                                        <option value="cortesia" ${intencion === 'cortesia' ? 'selected' : ''}>Cortesía</option>
                                        <option value="solicitud" ${intencion === 'solicitud' ? 'selected' : ''}>Solicitud</option>
                                        <option value="pregunta" ${intencion === 'pregunta' ? 'selected' : ''}>Pregunta</option>
                                        <option value="respuesta" ${intencion === 'respuesta' ? 'selected' : ''}>Respuesta</option>
                                        <option value="necesidad" ${intencion === 'necesidad' ? 'selected' : ''}>Necesidad</option>
                                        <option value="emergencia" ${intencion === 'emergencia' ? 'selected' : ''}>Emergencia</option>
                                        <option value="emocion" ${intencion === 'emocion' ? 'selected' : ''}>Emoción</option>
                                        <option value="informacion_personal" ${intencion === 'informacion_personal' ? 'selected' : ''}>Información Personal</option>
                                        <option value="ubicacion" ${intencion === 'ubicacion' ? 'selected' : ''}>Ubicación</option>
                                        <option value="tiempo" ${intencion === 'tiempo' ? 'selected' : ''}>Tiempo</option>
                                        <option value="otro" ${intencion === 'otro' ? 'selected' : ''}>Otro</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label for="annAceptabilidad">Linguística</label>
                                    <select id="annAceptabilidad">
                                        <option value="aceptable" ${aceptabilidad === 'aceptable' ? 'selected' : ''}>Aceptable</option>
                                        <option value="dudosa" ${aceptabilidad === 'dudosa' ? 'selected' : ''}>Dudosa</option>
                                        <option value="no_aceptable" ${aceptabilidad === 'no_aceptable' ? 'selected' : ''}>No Aceptable</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label for="annCalidad">Calidad Visual</label>
                                    <select id="annCalidad">
                                        <option value="buena" ${calidad === 'buena' ? 'selected' : ''}>Buena</option>
                                        <option value="regular" ${calidad === 'regular' ? 'selected' : ''}>Regular</option>
                                        <option value="mala" ${calidad === 'mala' ? 'selected' : ''}>Mala</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-field">
                                <label for="annObservacion">Observaciones Internas</label>
                                <textarea id="annObservacion" rows="2" placeholder="Notas sobre el señado, manos fuera de plano, etc.">${observacion}</textarea>
                            </div>

                            <div id="validationFeedback" class="error-msg hidden" style="margin-bottom:10px;"></div>

                            <!-- Botones de Acción de Anotador -->
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="btnActionReview">
                                    <i class="fa-solid fa-triangle-exclamation"></i> Enviar a Revisión
                                </button>
                                <button type="submit" class="btn btn-primary" id="btnActionSave">
                                    <i class="fa-solid fa-floppy-disk"></i> Guardar Anotación
                                </button>
                            </div>
                        </form>

                        <!-- Panel de Controles Exclusivos del Admin -->
                        ${isAdmin ? `
                        <div class="admin-actions card glass">
                            <h3><i class="fa-solid fa-key"></i> Decisiones Administrativas</h3>
                            
                            <!-- Asignar Split -->
                            <div class="form-field">
                                <label for="adminSplitSelect">Dataset Split (Conjunto)</label>
                                <select id="adminSplitSelect">
                                    <option value="unassigned" ${split === 'unassigned' ? 'selected' : ''}>Sin Asignar (Unassigned)</option>
                                    <option value="train" ${split === 'train' ? 'selected' : ''}>Entrenamiento (Train)</option>
                                    <option value="val" ${split === 'val' ? 'selected' : ''}>Validación (Val)</option>
                                    <option value="test" ${split === 'test' ? 'selected' : ''}>Prueba (Test)</option>
                                    <option value="holdout" ${split === 'holdout' ? 'selected' : ''}>Holdout</option>
                                </select>
                            </div>

                            <div class="form-field">
                                <label for="adminNotes">Notas Administrativas / Feedback</label>
                                <textarea id="adminNotes" rows="2" placeholder="Notas del administrador sobre la muestra o su aprobación...">${adminNotes}</textarea>
                            </div>

                            <!-- Rechazar Muestra (Módulo Condicional) -->
                            <div class="reject-panel hidden" id="rejectPanel">
                                <div class="form-field">
                                    <label for="adminRejectReason">Motivo de Rechazo (Obligatorio)</label>
                                    <select id="adminRejectReason">
                                        <option value="">-- Seleccione una razón --</option>
                                        <option value="video_borroso" ${motivoRechazo === 'video_borroso' ? 'selected' : ''}>Video borroso o de baja calidad</option>
                                        <option value="manos_fuera_de_cuadro" ${motivoRechazo === 'manos_fuera_de_cuadro' ? 'selected' : ''}>Manos fuera de cuadro</option>
                                        <option value="rostro_no_visible" ${motivoRechazo === 'rostro_no_visible' ? 'selected' : ''}>Rostro no visible</option>
                                        <option value="sena_incompleta" ${motivoRechazo === 'sena_incompleta' ? 'selected' : ''}>Seña incompleta</option>
                                        <option value="glosa_incorrecta" ${motivoRechazo === 'glosa_incorrecta' ? 'selected' : ''}>Glosa incorrecta</option>
                                        <option value="no_corresponde_prompt" ${motivoRechazo === 'no_corresponde_prompt' ? 'selected' : ''}>No corresponde al prompt</option>
                                        <option value="problema_tecnico" ${motivoRechazo === 'problema_tecnico' ? 'selected' : ''}>Problema técnico</option>
                                        <option value="otro" ${motivoRechazo === 'otro' ? 'selected' : ''}>Otro (Especificar en notas)</option>
                                    </select>
                                </div>
                                <div class="reject-actions">
                                    <button type="button" class="btn btn-secondary" id="btnCancelReject">Cancelar</button>
                                    <button type="button" class="btn btn-danger" id="btnConfirmReject">Confirmar Rechazo</button>
                                </div>
                            </div>

                            <!-- Panel de botones estándar -->
                            <div class="admin-buttons-row" id="adminButtonsRow">
                                <button type="button" class="btn btn-secondary" id="btnAdminReturnPending">
                                    <i class="fa-solid fa-rotate-left"></i> Devolver a Pendiente
                                </button>
                                <button type="button" class="btn btn-danger" id="btnAdminRejectTrigger">
                                    <i class="fa-solid fa-ban"></i> Rechazar
                                </button>
                                <button type="button" class="btn btn-success btn-glow" id="btnAdminValidate">
                                    <i class="fa-solid fa-circle-check"></i> Validar y Aprobar
                                </button>
                            </div>

                            <div id="adminActionFeedback" class="error-msg hidden" style="margin-top:10px;"></div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        this.setupDetailEvents();
    }

    /**
     * Asigna listeners de eventos en la ficha de detalle
     */
    setupDetailEvents() {
        const form = document.getElementById("annotationForm");
        const selectTipo = document.getElementById("annTipo");
        const containerGlosa = document.getElementById("glosaFinalContainer");
        const containerSecuencia = document.getElementById("secuenciaGlosasContainer");
        const btnSave = document.getElementById("btnActionSave");
        const btnReview = document.getElementById("btnActionReview");
        const feedbackDiv = document.getElementById("validationFeedback");

        const sampleId = this.selectedSample.sample.sample_id;

        // Alternar campos condicionales
        selectTipo.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val === "aislada" || val === "expresion") {
                containerGlosa.classList.remove("hidden");
                containerSecuencia.classList.add("hidden");
            } else {
                containerGlosa.classList.add("hidden");
                containerSecuencia.classList.remove("hidden");
            }
        });

        // Guardar anotación
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const payload = this.gatherAnnotationForm();
            if (!payload) return;

            try {
                feedbackDiv.classList.add("hidden");
                btnSave.disabled = true;
                btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

                await this.apiPost("saveAnnotation", { annotation: payload });
                
                // Recargar detalle y lista
                this.selectSample(sampleId);
            } catch (err) {
                feedbackDiv.textContent = err.message;
                feedbackDiv.classList.remove("hidden");
                btnSave.disabled = false;
                btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar Anotación`;
            }
        });

        // Enviar a revisión
        btnReview.addEventListener("click", async () => {
            const observacion = document.getElementById("annObservacion").value.trim();
            if (!observacion) {
                feedbackDiv.textContent = "Por favor escriba el motivo del envío a revisión en las Observaciones Internas.";
                feedbackDiv.classList.remove("hidden");
                return;
            }

            try {
                feedbackDiv.classList.add("hidden");
                btnReview.disabled = true;
                btnReview.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;

                await this.apiPost("markRequiresReview", {
                    sample_id: sampleId,
                    observacion: observacion
                });

                this.selectSample(sampleId);
            } catch (err) {
                feedbackDiv.textContent = err.message;
                feedbackDiv.classList.remove("hidden");
                btnReview.disabled = false;
                btnReview.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Enviar a Revisión`;
            }
        });

        // Eventos de administrador
        if (this.session.user.role === "admin") {
            const selectSplit = document.getElementById("adminSplitSelect");
            const adminNotes = document.getElementById("adminNotes");
            const btnValidate = document.getElementById("btnAdminValidate");
            const btnRejectTrigger = document.getElementById("btnAdminRejectTrigger");
            const btnReturnPending = document.getElementById("btnAdminReturnPending");
            
            const rejectPanel = document.getElementById("rejectPanel");
            const adminButtonsRow = document.getElementById("adminButtonsRow");
            const btnCancelReject = document.getElementById("btnCancelReject");
            const btnConfirmReject = document.getElementById("btnConfirmReject");
            const adminFeedbackDiv = document.getElementById("adminActionFeedback");

            // Cambiar split
            selectSplit.addEventListener("change", async (e) => {
                const splitVal = e.target.value;
                try {
                    await this.apiPost("updateSampleSplit", {
                        sample_id: sampleId,
                        split: splitVal
                    });
                    this.selectSample(sampleId);
                } catch (err) {
                    alert(`Error al actualizar split: ${err.message}`);
                    selectSplit.value = this.selectedSample.sample.split || "unassigned";
                }
            });

            // Validar
            btnValidate.addEventListener("click", async () => {
                try {
                    adminFeedbackDiv.classList.add("hidden");
                    btnValidate.disabled = true;
                    btnValidate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Validando...`;

                    await this.apiPost("validateAnnotation", {
                        sample_id: sampleId,
                        admin_notes: adminNotes.value.trim()
                    });

                    this.selectSample(sampleId);
                } catch (err) {
                    adminFeedbackDiv.textContent = err.message;
                    adminFeedbackDiv.classList.remove("hidden");
                    btnValidate.disabled = false;
                    btnValidate.innerHTML = `<i class="fa-solid fa-circle-check"></i> Validar y Aprobar`;
                }
            });

            // Volver a pendiente
            btnReturnPending.addEventListener("click", async () => {
                try {
                    adminFeedbackDiv.classList.add("hidden");
                    btnReturnPending.disabled = true;
                    btnReturnPending.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Devolviendo...`;

                    await this.apiPost("returnToReview", {
                        sample_id: sampleId,
                        admin_notes: adminNotes.value.trim()
                    });

                    this.selectSample(sampleId);
                } catch (err) {
                    adminFeedbackDiv.textContent = err.message;
                    adminFeedbackDiv.classList.remove("hidden");
                    btnReturnPending.disabled = false;
                    btnReturnPending.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Devolver a Pendiente`;
                }
            });

            // Mostrar panel de rechazo
            btnRejectTrigger.addEventListener("click", () => {
                rejectPanel.classList.remove("hidden");
                adminButtonsRow.classList.add("hidden");
            });

            // Cancelar rechazo
            btnCancelReject.addEventListener("click", () => {
                rejectPanel.classList.add("hidden");
                adminButtonsRow.classList.remove("hidden");
            });

            // Confirmar rechazo
            btnConfirmReject.addEventListener("click", async () => {
                const reason = document.getElementById("adminRejectReason").value;
                if (!reason) {
                    adminFeedbackDiv.textContent = "Debe elegir un motivo de rechazo.";
                    adminFeedbackDiv.classList.remove("hidden");
                    return;
                }

                try {
                    adminFeedbackDiv.classList.add("hidden");
                    btnConfirmReject.disabled = true;
                    btnConfirmReject.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Rechazando...`;

                    await this.apiPost("rejectAnnotation", {
                        sample_id: sampleId,
                        motivo_rechazo: reason,
                        admin_notes: adminNotes.value.trim()
                    });

                    this.selectSample(sampleId);
                } catch (err) {
                    adminFeedbackDiv.textContent = err.message;
                    adminFeedbackDiv.classList.remove("hidden");
                    btnConfirmReject.disabled = false;
                    btnConfirmReject.innerHTML = "Confirmar Rechazo";
                }
            });
        }
    }

    /**
     * Recolecta y valida la información del formulario de anotación
     */
    gatherAnnotationForm() {
        const sampleId = this.selectedSample.sample.sample_id;
        const tipo = document.getElementById("annTipo").value;
        const glosaFinal = document.getElementById("annGlosaFinal").value.trim();
        const secuencia = document.getElementById("annSecuenciaGlosas").value.trim();
        const textoEs = document.getElementById("annTextoEsFinal").value.trim();
        const intencion = document.getElementById("annIntencion").value;
        const aceptabilidad = document.getElementById("annAceptabilidad").value;
        const calidad = document.getElementById("annCalidad").value;
        const observacion = document.getElementById("annObservacion").value.trim();

        const feedbackDiv = document.getElementById("validationFeedback");
        
        // Validación en cliente
        if (!textoEs) {
            feedbackDiv.textContent = "El campo 'Traducción Final al Español' es obligatorio.";
            feedbackDiv.classList.remove("hidden");
            return null;
        }

        if ((tipo === "aislada" || tipo === "expresion") && !glosaFinal) {
            feedbackDiv.textContent = "La 'Glosa Unificada' es obligatoria para muestras aisladas o de expresión.";
            feedbackDiv.classList.remove("hidden");
            return null;
        }

        if ((tipo === "plantilla" || tipo === "continua") && !secuencia) {
            feedbackDiv.textContent = "La 'Secuencia de Glosas' es obligatoria para muestras continuas o con plantillas.";
            feedbackDiv.classList.remove("hidden");
            return null;
        }

        return {
            sample_id: sampleId,
            tipo_muestra: tipo,
            glosa_final: tipo === "aislada" || tipo === "expresion" ? glosaFinal : "",
            secuencia_glosas: tipo === "plantilla" || tipo === "continua" ? secuencia : "",
            texto_es_final: textoEs,
            intencion_comunicativa: intencion,
            aceptabilidad_linguistica: aceptabilidad,
            calidad_visual: calidad,
            observacion: observacion
        };
    }

    /**
     * Pestaña de Gestión de Usuarios
     */
    async renderUsersTab(body) {
        body.innerHTML = `
            <div class="users-layout">
                <!-- Columna Izquierda: Listado de usuarios -->
                <div class="users-list-panel glass">
                    <h3>Usuarios del Sistema</h3>
                    <div class="table-scroll">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Alias</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Último Acceso</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr>
                                    <td colspan="5" style="text-align:center;">Cargando usuarios...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Columna Derecha: Formulario agregar/editar -->
                <div class="user-form-panel glass">
                    <h3><i class="fa-solid fa-user-plus"></i> Registrar / Editar Usuario</h3>
                    <form id="userForm" class="input-group">
                        <div class="form-field">
                            <label for="usrEmail">Correo Electrónico (Clave Única)</label>
                            <input type="email" id="usrEmail" required placeholder="anotador@correo.com">
                        </div>

                        <div class="form-field">
                            <label for="usrAlias">Alias o Nombre</label>
                            <input type="text" id="usrAlias" required placeholder="Anotador A">
                        </div>

                        <div class="form-field">
                            <label for="usrCode">Código de Acceso (Texto Plano)</label>
                            <input type="text" id="usrCode" required placeholder="Ej: ANOT123">
                        </div>

                        <div class="form-row-grid">
                            <div class="form-field">
                                <label for="usrRole">Rol</label>
                                <select id="usrRole">
                                    <option value="annotator" selected>Anotador (Annotator)</option>
                                    <option value="admin">Administrador (Admin)</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label for="usrStatus">Estado</label>
                                <select id="usrStatus">
                                    <option value="active" selected>Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <div id="userFeedback" class="error-msg hidden"></div>
                        <div id="userSuccess" class="success-msg hidden">Usuario guardado exitosamente.</div>

                        <button type="submit" class="btn btn-primary btn-glow" id="btnUserSubmit" style="width:100%; margin-top:10px;">
                            <i class="fa-solid fa-user-check"></i> Guardar Usuario
                        </button>
                    </form>
                </div>
            </div>
        `;

        const tableBody = document.getElementById("usersTableBody");
        const form = document.getElementById("userForm");
        const btnSubmit = document.getElementById("btnUserSubmit");
        const errorDiv = document.getElementById("userFeedback");
        const successDiv = document.getElementById("userSuccess");

        // Cargar usuarios
        const loadUsers = async () => {
            try {
                const res = await this.apiPost("listUsers");
                const users = res.users || [];
                tableBody.innerHTML = users.map(u => {
                    const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString() : "Nunca";
                    return `
                        <tr class="user-row" data-email="${u.email}" data-alias="${u.alias}" data-role="${u.role}" data-status="${u.status}">
                            <td><strong>${u.alias}</strong></td>
                            <td>${u.email}</td>
                            <td><span class="role-badge ${u.role}">${u.role.toUpperCase()}</span></td>
                            <td><span class="status-badge ${u.status}">${u.status.toUpperCase()}</span></td>
                            <td><small>${lastLogin}</small></td>
                        </tr>
                    `;
                }).join("");

                // Hacer filas seleccionables para rellenar formulario
                const rows = tableBody.querySelectorAll(".user-row");
                rows.forEach(row => {
                    row.addEventListener("click", () => {
                        document.getElementById("usrEmail").value = row.dataset.email;
                        document.getElementById("usrAlias").value = row.dataset.alias;
                        document.getElementById("usrRole").value = row.dataset.role;
                        document.getElementById("usrStatus").value = row.dataset.status;
                        document.getElementById("usrCode").value = ""; // No se expone el código por seguridad en UI
                        document.getElementById("usrCode").placeholder = "(Dejar vacío para mantener actual)";
                        document.getElementById("usrCode").required = false;
                    });
                });
            } catch (e) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-error);">${e.message}</td></tr>`;
            }
        };

        await loadUsers();

        // Enviar formulario
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            errorDiv.classList.add("hidden");
            successDiv.classList.add("hidden");

            const email = document.getElementById("usrEmail").value.trim();
            const alias = document.getElementById("usrAlias").value.trim();
            const role = document.getElementById("usrRole").value;
            const status = document.getElementById("usrStatus").value;
            const code = document.getElementById("usrCode").value.trim();

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

                const userData = { email, alias, role, status };
                if (code) {
                    userData.access_code = code;
                }

                await this.apiPost("upsertUser", { userData });
                
                successDiv.classList.remove("hidden");
                form.reset();
                document.getElementById("usrCode").required = true;
                document.getElementById("usrCode").placeholder = "Ej: ANOT123";
                
                await loadUsers();
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove("hidden");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i class="fa-solid fa-user-check"></i> Guardar Usuario`;
            }
        });
    }

    /**
     * Pestaña de Exportación de Dataset
     */
    renderExportTab(body) {
        body.innerHTML = `
            <div class="export-wrapper">
                <div class="card glass export-card">
                    <div class="card-header">
                        <i class="fa-solid fa-file-export"></i>
                        <h2>Exportación del Dataset LSP</h2>
                    </div>
                    <div class="input-group">
                        <p class="export-description">
                            Por defecto, la exportación solo incluye muestras en estado <strong class="text-success">validado</strong>, que tengan una calidad visual <strong>buena o regular</strong>, aceptabilidad lingüística <strong>aceptable</strong> y pertenezcan a un split asignado. Use las opciones inferiores para modificar este comportamiento.
                        </p>

                        <div class="export-options card glass">
                            <h4>Parámetros de Exportación (Admin)</h4>
                            
                            <label class="check-item">
                                <input type="checkbox" id="expPending">
                                <span>Incluir muestras pendientes o solo anotadas (y muestras sin split)</span>
                            </label>

                            <label class="check-item">
                                <input type="checkbox" id="expRejected">
                                <span>Incluir muestras rechazadas</span>
                            </label>

                            <label class="check-item">
                                <input type="checkbox" id="expNonIdeal">
                                <span>Incluir calidad visual mala o aceptabilidad dudosa/no aceptable</span>
                            </label>
                        </div>

                        <div id="exportFeedback" class="error-msg hidden" style="margin-top:10px;"></div>
                        <div id="exportSuccess" class="success-msg hidden" style="margin-top:10px;"></div>

                        <button id="btnExportSubmit" class="btn btn-primary btn-glow" style="width:100%; margin-top:20px;">
                            <i class="fa-solid fa-download"></i> Generar y Descargar JSON
                        </button>
                    </div>
                </div>
            </div>
        `;

        const btnExport = document.getElementById("btnExportSubmit");
        const errDiv = document.getElementById("exportFeedback");
        const succDiv = document.getElementById("exportSuccess");

        btnExport.addEventListener("click", async () => {
            errDiv.classList.add("hidden");
            succDiv.classList.add("hidden");

            const includePending = document.getElementById("expPending").checked;
            const includeRejected = document.getElementById("expRejected").checked;
            const includeNonIdeal = document.getElementById("expNonIdeal").checked;

            try {
                btnExport.disabled = true;
                btnExport.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando JSON...`;

                const res = await this.apiPost("exportDataset", {
                    include_pending: includePending,
                    include_rejected: includeRejected,
                    include_non_ideal: includeNonIdeal
                });

                const dataset = res.dataset || [];

                if (dataset.length === 0) {
                    throw new Error("No hay registros en el dataset que cumplan los criterios seleccionados.");
                }

                // Generar descarga
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                
                const timestamp = new Date().toISOString().slice(0,10);
                downloadAnchor.setAttribute("download", `dataset_lsp_export_${timestamp}.json`);
                
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();

                succDiv.textContent = `¡Exportación exitosa! Se descargaron ${dataset.length} muestras.`;
                succDiv.classList.remove("hidden");
            } catch (e) {
                errDiv.textContent = e.message;
                errDiv.classList.remove("hidden");
            } finally {
                btnExport.disabled = false;
                btnExport.innerHTML = `<i class="fa-solid fa-download"></i> Generar y Descargar JSON`;
            }
        });
    }
}
