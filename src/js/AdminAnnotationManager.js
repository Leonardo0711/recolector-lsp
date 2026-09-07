/**
 * AdminAnnotationManager.js
 * Módulo para la gestión de anotación, validación y administración de usuarios (Fase II)
 */

export class AdminAnnotationManager {
    constructor() {
        this.gasUrl = import.meta.env.VITE_GAS_URL;
        this.container = document.getElementById("dashboardContainer");
        this.session = null;
        this.currentTab = "summary"; // summary, pending, annotated, validated, users, export
        this.samples = [];
        this.selectedSample = null;
        this.isLoading = false;
        this.currentVideoBlobUrl = null;
    }

    /**
     * Extrae el ID del archivo desde una URL de Google Drive
     */
    getFileId(url) {
        if (!url) return null;
        if (url.startsWith("blob:") || url.includes("localhost")) {
            return null;
        }
        const matches = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        return (matches && matches[1]) ? matches[1] : null;
    }

    /**
     * Convierte un enlace de Google Drive en un enlace de descarga directa/streaming
     */
    getDirectVideoUrl(url) {
        if (!url) return "";
        const fileId = this.getFileId(url);
        if (fileId) {
            return `https://docs.google.com/uc?export=download&id=${fileId}`;
        }
        return url;
    }

    /**
     * Convierte un enlace de Google Drive en un enlace de reproducción embebido (iframe)
     */
    getEmbedVideoUrl(url) {
        if (!url) return "";
        const fileId = this.getFileId(url);
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return "";
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

        // Si no hay sesión admin explícita, verificar si el usuario activo en la app principal es admin
        if (!this.session) {
            const userSessionStr = localStorage.getItem("lsp_user_session");
            if (userSessionStr) {
                try {
                    const uSession = JSON.parse(userSessionStr);
                    if (uSession && uSession.role === "admin") {
                        const adminEmail = (uSession.participant && uSession.participant.email) || "leonardo.caballero.h@uni.pe";
                        const adminAlias = (uSession.participant && uSession.participant.alias) || "Administrador";
                        this.session = {
                            email: adminEmail,
                            accessCode: "admin_auto_auth",
                            user: {
                                alias: adminAlias,
                                email: adminEmail,
                                role: "admin"
                            }
                        };
                        localStorage.setItem("lsp_admin_session", JSON.stringify(this.session));
                    }
                } catch (e) {}
            }
        }

        // Renderizar pantalla inicial
        this.render();
    }

    /**
     * Abre el panel ocultando las demás secciones de la app
     */
    open() {
        // Asegurar sesión de admin activa si viene de la app
        if (!this.session) {
            const userSessionStr = localStorage.getItem("lsp_user_session");
            if (userSessionStr) {
                try {
                    const uSession = JSON.parse(userSessionStr);
                    if (uSession && uSession.role === "admin") {
                        const adminEmail = (uSession.participant && uSession.participant.email) || "leonardo.caballero.h@uni.pe";
                        const adminAlias = (uSession.participant && uSession.participant.alias) || "Administrador";
                        this.session = {
                            email: adminEmail,
                            accessCode: "admin_auto_auth",
                            user: {
                                alias: adminAlias,
                                email: adminEmail,
                                role: "admin"
                            }
                        };
                        localStorage.setItem("lsp_admin_session", JSON.stringify(this.session));
                    }
                } catch (e) {}
            }
        }

        document.getElementById("landing").classList.add("hidden");
        document.getElementById("appContainer").classList.add("hidden");
        this.container.classList.remove("hidden");
        this.render();
    }

    /**
     * Cierra el panel y vuelve al landing
     */
    close() {
        if (this.currentVideoBlobUrl) {
            URL.revokeObjectURL(this.currentVideoBlobUrl);
            this.currentVideoBlobUrl = null;
        }
        this.container.classList.add("hidden");
        const landing = document.getElementById("landing");
        if (landing) {
            landing.classList.remove("hidden");
        }
        // Limpiar hash si corresponde
        if (window.location.hash === "#admin" || window.location.hash === "#/admin") {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
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
                        <button class="nav-tab ${this.currentTab === 'summary' ? 'active' : ''}" data-tab="summary">
                            <i class="fa-solid fa-chart-simple"></i> Resumen
                        </button>
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
                            <i class="fa-solid fa-users"></i> Participantes
                        </button>
                        <button class="nav-tab ${this.currentTab === 'export' ? 'active' : ''}" data-tab="export">
                            <i class="fa-solid fa-file-export"></i> Exportar
                        </button>
                        ` : ''}
                    </nav>

                    <div class="db-user-actions">
                        <div class="user-chip" title="Usuario conectado: ${this.session.user.alias}">
                            <i class="fa-solid fa-circle-user"></i>
                            <span class="user-name">${this.session.user.alias}</span>
                        </div>
                        <button class="theme-switch db-theme-switch" title="Cambiar tema" aria-label="Cambiar tema claro/oscuro">
                            <span class="switch-stars"></span>
                            <span class="switch-knob"><i class="fa-solid ${(document.documentElement.getAttribute('data-theme') || 'dark') === 'light' ? 'fa-sun' : 'fa-moon'} theme-icon"></i></span>
                        </button>
                        <button class="btn btn-secondary btn-back-recolector" id="btnBackToGrabador" title="Volver al recolector público">
                            <i class="fa-solid fa-arrow-left"></i> <span class="btn-text">Volver</span>
                        </button>
                        <button class="btn btn-danger btn-logout-admin" id="btnLogout" title="Cerrar sesión">
                            <i class="fa-solid fa-right-from-bracket"></i> <span class="btn-text">Salir</span>
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
            if (this.currentVideoBlobUrl) {
                URL.revokeObjectURL(this.currentVideoBlobUrl);
                this.currentVideoBlobUrl = null;
            }
            localStorage.removeItem("lsp_admin_session");
            this.session = null;
            this.render();
        });

        document.getElementById("btnBackToGrabador").addEventListener("click", () => {
            this.close();
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

        if (this.currentTab === "summary") {
            this.renderSummaryTab(body);
            return;
        }

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
                (s.participant_alias || "").toLowerCase().includes(searchTerm) ||
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
                        <span><i class="fa-solid fa-user"></i> ${s.participant_alias || s.participant_id}</span>
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
        const segmentacionGlosas = ann.segmentacion_glosas || "";
        const textoEsFinal = ann.texto_es_final || sample.produced_text_es || "";
        const intencion = ann.intencion_comunicativa || "saludo";
        const aceptabilidad = ann.aceptabilidad_linguistica || "aceptable";
        const calidad = ann.calidad_visual || "buena";
        const observacion = ann.observacion || "";
        const motivoRechazo = ann.motivo_rechazo || "";
        const adminNotes = ann.admin_notes || "";
        const split = sample.split || "unassigned";

        const statusClass = `status-${(sample.annotation_status || "pendiente").trim().toLowerCase()}`;

        const isDriveUrl = sample.video_url && (sample.video_url.includes("drive.google.com") || sample.video_url.includes("docs.google.com"));
        const videoElementHtml = isDriveUrl
            ? `<div class="video-loading-placeholder" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; min-height:200px; color:var(--text-muted);">
                   <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px; color:var(--primary);"></i>
                   <span>Cargando video de Google Drive de forma segura...</span>
               </div>
               <video style="display:none;" controls class="detail-video"></video>`
            : `<video src="${sample.video_url}" controls class="detail-video"></video>`;

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

                <!-- Contenedor del Video Prominente (Grande) -->
                <div class="detail-video-hero">
                    <div class="video-preview-wrapper">
                        ${videoElementHtml}
                    </div>
                </div>

                <div class="detail-grid">
                    <!-- Sección Izquierda: Ficha Técnica de Captura y Decisiones Administrativas -->
                    <div class="grid-col-video">
                        <div class="technical-specs card glass">
                            <h4>Ficha Técnica</h4>
                            <div class="spec-table">
                                <div class="spec-row"><span>Vocabulario:</span><strong>${sample.label}</strong></div>
                                <div class="spec-row"><span>Texto Guía:</span><strong>${sample.prompt_text || "--"}</strong></div>
                                <div class="spec-row"><span>Participante:</span><strong>${sample.participant_alias || "Desconocido"} (${sample.participant_id})</strong></div>
                                <div class="spec-row"><span>Resolución:</span><strong>${sample.width ? `${sample.width}x${sample.height}` : "No registrada"}</strong></div>
                                <div class="spec-row"><span>Duración:</span><strong>${parseFloat(sample.duration_sec || 0).toFixed(2)}s</strong></div>
                                <div class="spec-row"><span>Repetición:</span><strong>#${sample.repetition || "1"}</strong></div>
                            </div>
                        </div>

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

                            <div id="segmentacionGlosasContainer" class="form-field ${isIsolated ? 'hidden' : ''}">
                                <label for="annSegmentacionGlosas">Segmentación Temporal / Tiempos (Inicio-Fin)</label>
                                <input type="text" id="annSegmentacionGlosas" placeholder="Ej: YO (0.2-0.8), COMPRAR (1.0-1.7), MANZANA (2.0-2.8)" value="${segmentacionGlosas}">
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
                                <button type="submit" class="btn btn-primary btn-glow" id="btnActionSave">
                                    <i class="fa-solid fa-floppy-disk"></i> Guardar Anotación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupDetailEvents();
        if (isDriveUrl) {
            this.loadDriveVideo(sample.video_url);
        }
    }

    /**
     * Carga de forma segura un video de Google Drive descargándolo como bytes base64 desde el backend
     */
    async loadDriveVideo(videoUrl) {
        const fileId = this.getFileId(videoUrl);
        const placeholder = this.container.querySelector(".video-loading-placeholder");
        const videoEl = this.container.querySelector(".detail-video");
        
        if (!fileId || !videoEl) return;

        const currentSampleId = this.selectedSample ? this.selectedSample.sample.sample_id : null;

        try {
            // Limpiar blob URL anterior para evitar fugas de memoria
            if (this.currentVideoBlobUrl) {
                URL.revokeObjectURL(this.currentVideoBlobUrl);
                this.currentVideoBlobUrl = null;
            }

            const res = await this.apiPost("getVideoBytes", { fileId });
            
            // Si la muestra seleccionada cambió mientras descargábamos, ignoramos el resultado
            if (!this.selectedSample || this.selectedSample.sample.sample_id !== currentSampleId) {
                return;
            }

            if (res.status === "success" && res.base64) {
                const binaryString = atob(res.base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const mimeType = res.mimeType || "video/webm";
                const blob = new Blob([bytes], { type: mimeType });
                this.currentVideoBlobUrl = URL.createObjectURL(blob);
                
                videoEl.src = this.currentVideoBlobUrl;
                videoEl.style.display = "block";
                if (placeholder) placeholder.remove();
            } else {
                throw new Error(res.message || "Error al obtener bytes de video.");
            }
        } catch (error) {
            console.error("Error al cargar video de Drive:", error);
            // Solo actualizamos la UI si seguimos en la misma muestra
            if (this.selectedSample && this.selectedSample.sample.sample_id === currentSampleId && placeholder) {
                placeholder.innerHTML = `<span style="color:var(--record); text-align:center; padding: 20px; display:flex; flex-direction:column; align-items:center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; margin-bottom:8px;"></i>
                    <span>Error al descargar video: ${error.message}</span>
                </span>`;
            }
        }
    }

    /**
     * Recarga la cola actual y actualiza el visor de detalle si la muestra aún existe en ella, o la limpia si se movió a otro estado
     */
    async refreshQueue() {
        const currentSampleId = this.selectedSample ? this.selectedSample.sample.sample_id : null;
        
        // Recargar la lista del tab actual
        await this.loadTabContent();
        
        // Verificar si la muestra seleccionada aún pertenece a esta cola
        const stillExists = this.samples.some(s => s.sample_id === currentSampleId);
        if (stillExists && currentSampleId) {
            await this.selectSample(currentSampleId);
        } else {
            this.selectedSample = null;
            const detailPanel = document.getElementById("queueDetailPanel");
            if (detailPanel) {
                detailPanel.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-video"></i>
                        <h3>Seleccione una muestra</h3>
                        <p>Elija una tarjeta de la izquierda para comenzar el análisis.</p>
                    </div>
                `;
            }
        }
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
            const containerSegmentacion = document.getElementById("segmentacionGlosasContainer");
            if (val === "aislada" || val === "expresion") {
                containerGlosa.classList.remove("hidden");
                containerSecuencia.classList.add("hidden");
                if (containerSegmentacion) containerSegmentacion.classList.add("hidden");
            } else {
                containerGlosa.classList.add("hidden");
                containerSecuencia.classList.remove("hidden");
                if (containerSegmentacion) containerSegmentacion.classList.remove("hidden");
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
                
                // Recargar detalle y lista de la cola
                await this.refreshQueue();
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

                await this.refreshQueue();
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
                    await this.refreshQueue();
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

                    await this.refreshQueue();
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

                    await this.refreshQueue();
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

                    await this.refreshQueue();
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
        const segmentacion = document.getElementById("annSegmentacionGlosas") ? document.getElementById("annSegmentacionGlosas").value.trim() : "";
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
            segmentacion_glosas: tipo === "plantilla" || tipo === "continua" ? segmentacion : "",
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
    /**
     * Pestaña de Directorio de Participantes y Gestión de Claves Temporales
     */
    async renderUsersTab(body) {
        body.innerHTML = `
            <div class="users-directory-container">
                <div class="users-header-row">
                    <div>
                        <h2><i class="fa-solid fa-users"></i> Directorio de Participantes</h2>
                        <p class="section-subtitle">Visualiza a los usuarios registrados y autogenera códigos temporales para quienes olviden su contraseña.</p>
                    </div>
                    <div class="users-actions-bar">
                        <div class="search-input-wrapper">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="userSearchInput" placeholder="Buscar por nombre, correo o ID..." autocomplete="off">
                        </div>
                        <button id="btnRefreshUsers" class="btn btn-secondary btn-sm" title="Refrescar lista">
                            <i class="fa-solid fa-arrows-rotate"></i> Actualizar
                        </button>
                    </div>
                </div>

                <!-- Tarjetas de métricas globales -->
                <div class="users-metrics-grid">
                    <div class="metric-card glass">
                        <div class="metric-icon"><i class="fa-solid fa-users-line"></i></div>
                        <div class="metric-info">
                            <span class="metric-num" id="statTotalUsers">0</span>
                            <span class="metric-lbl">Total Registrados</span>
                        </div>
                    </div>
                    <div class="metric-card glass">
                        <div class="metric-icon success"><i class="fa-solid fa-shield-check"></i></div>
                        <div class="metric-info">
                            <span class="metric-num" id="statActiveUsers">0</span>
                            <span class="metric-lbl">Con Contraseña Activa</span>
                        </div>
                    </div>
                    <div class="metric-card glass">
                        <div class="metric-icon warning"><i class="fa-solid fa-key"></i></div>
                        <div class="metric-info">
                            <span class="metric-num" id="statPendingReset">0</span>
                            <span class="metric-lbl">Códigos Pendientes</span>
                        </div>
                    </div>
                    <div class="metric-card glass">
                        <div class="metric-icon primary"><i class="fa-solid fa-video"></i></div>
                        <div class="metric-info">
                            <span class="metric-num" id="statTotalSamples">0</span>
                            <span class="metric-lbl">Videos Grabados</span>
                        </div>
                    </div>
                </div>

                <!-- Tabla de participantes -->
                <div class="users-table-card glass">
                    <div class="table-scroll">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Participante</th>
                                    <th>ID / Perfil</th>
                                    <th>Progreso</th>
                                    <th>Rol</th>
                                    <th>Estado de Contraseña</th>
                                    <th style="text-align: right;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr>
                                    <td colspan="6" style="text-align:center; padding: 28px;">
                                        <i class="fa-solid fa-spinner fa-spin"></i> Cargando usuarios...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modal de Código Autogenerado -->
                <div id="adminResetModal" class="admin-modal-backdrop hidden">
                    <div class="admin-modal-card glass">
                        <div class="modal-header">
                            <div class="modal-icon-glow"><i class="fa-solid fa-key"></i></div>
                            <div>
                                <h3>¡Código Temporal Autogenerado!</h3>
                                <p id="modalUserSubtitle">Listo para enviar al participante</p>
                            </div>
                        </div>
                        <div class="modal-body">
                            <p class="modal-instruction">
                                Envía este código al participante. Al entrar con su correo, lo colocará para crear su nueva contraseña:
                            </p>
                            <div class="generated-code-display">
                                <code id="modalGeneratedCode">LSP-0000</code>
                                <button id="btnModalCopyCode" class="btn btn-sm btn-primary" title="Copiar código">
                                    <i class="fa-solid fa-copy"></i> Copiar Código
                                </button>
                            </div>
                            <div class="message-preview-box">
                                <label><i class="fa-brands fa-whatsapp"></i> Mensaje listo para WhatsApp / Correo:</label>
                                <textarea id="modalMessageTemplate" readonly rows="3"></textarea>
                                <button id="btnModalCopyMessage" class="btn btn-sm btn-secondary" style="width: 100%; margin-top: 8px;">
                                    <i class="fa-solid fa-share-nodes"></i> Copiar Mensaje Completo
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="btnCloseResetModal" class="btn btn-primary btn-glow" style="width: 100%;">
                                <i class="fa-solid fa-check"></i> Listo / Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const tableBody = document.getElementById("usersTableBody");
        const searchInput = document.getElementById("userSearchInput");
        const btnRefresh = document.getElementById("btnRefreshUsers");
        const modalBackdrop = document.getElementById("adminResetModal");
        const modalCode = document.getElementById("modalGeneratedCode");
        const modalSubtitle = document.getElementById("modalUserSubtitle");
        const modalMsg = document.getElementById("modalMessageTemplate");
        const btnCloseModal = document.getElementById("btnCloseResetModal");
        const btnModalCopyCode = document.getElementById("btnModalCopyCode");
        const btnModalCopyMessage = document.getElementById("btnModalCopyMessage");

        let cachedUsers = [];

        const renderTable = (usersToRender) => {
            if (!usersToRender || usersToRender.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">
                            <i class="fa-solid fa-user-slash"></i> No se encontraron participantes.
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = usersToRender.map(u => {
                const alias = u.alias || "Participante";
                const initial = (alias[0] || "P").toUpperCase();
                const totalSamples = u.total_samples || 0;
                const percent = Math.min(Math.round((totalSamples / 400) * 100), 100);
                const roleBadge = u.role === 'admin' 
                    ? `<span class="badge-role-admin"><i class="fa-solid fa-shield-halved"></i> ADMIN</span>`
                    : `<span class="badge-role-user">PARTICIPANTE</span>`;

                const pwdBadge = u.must_change_password
                    ? `<span class="badge-pwd-pending" title="Pendiente de definir o restablecer contraseña">
                         <i class="fa-solid fa-clock"></i> Código: <code>${u.temp_code || 'Por asignar'}</code>
                       </span>`
                    : `<span class="badge-pwd-active" title="Contraseña creada y activa">
                         <i class="fa-solid fa-circle-check"></i> Contraseña Lista
                       </span>`;

                return `
                    <tr class="user-row-item">
                        <td>
                            <div class="user-cell-profile">
                                <div class="user-avatar-initial">${initial}</div>
                                <div class="user-meta-text">
                                    <strong>${alias}</strong>
                                    <small>${u.email}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="user-cell-demographics">
                                <span class="tag-id">${u.participant_id || '---'}</span>
                                <small>${u.dominant_hand || 'Derecha'} • ${u.lsp_level || 'Básico'} • ${u.region || 'Lima'}</small>
                            </div>
                        </td>
                        <td>
                            <div class="user-cell-progress">
                                <div class="progress-bar-mini-bg">
                                    <div class="progress-bar-mini-fill" style="width: ${percent}%;"></div>
                                </div>
                                <span class="progress-label-mini">${totalSamples} / 400 videos (${percent}%)</span>
                            </div>
                        </td>
                        <td>${roleBadge}</td>
                        <td>${pwdBadge}</td>
                        <td style="text-align: right;">
                            <div class="user-action-buttons">
                                <button class="btn btn-sm btn-action-reset" data-email="${u.email}" data-alias="${alias}" title="Autogenerar nueva clave temporal para este usuario">
                                    <i class="fa-solid fa-rotate-right"></i> Autogenerar Clave
                                </button>
                                ${u.temp_code ? `
                                <button class="btn btn-sm btn-action-copy" data-code="${u.temp_code}" data-email="${u.email}" data-alias="${alias}" title="Copiar código temporal para enviar">
                                    <i class="fa-solid fa-copy"></i> Copiar
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            // Vincular botones de reseteo
            tableBody.querySelectorAll(".btn-action-reset").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const email = btn.dataset.email;
                    const alias = btn.dataset.alias;

                    if (!confirm(`¿Deseas autogenerar una nueva clave temporal para "${alias}" (${email})? El usuario podrá usarla para definir una nueva contraseña.`)) {
                        return;
                    }

                    try {
                        btn.disabled = true;
                        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando...`;

                        const res = await this.apiPost("adminResetParticipantPassword", {
                            target_email: email
                        });

                        const newCode = res.temp_code || "LSP-XXXX";
                        showResetModal(alias, email, newCode);
                        await loadUsers(false);
                    } catch (err) {
                        alert("Error al autogenerar clave: " + (err.message || err));
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Autogenerar Clave`;
                    }
                });
            });

            // Vincular botones de copiado rápido
            tableBody.querySelectorAll(".btn-action-copy").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const code = btn.dataset.code;
                    const email = btn.dataset.email;
                    const alias = btn.dataset.alias;
                    showResetModal(alias, email, code);
                });
            });
        };

        const showResetModal = (alias, email, code) => {
            modalSubtitle.textContent = `${alias} (${email})`;
            modalCode.textContent = code;
            modalMsg.value = `Hola ${alias}, tu código temporal de activación para DataCollect LSP es: ${code}\nIngresa a la plataforma con tu correo (${email}), coloca este código y crea tu nueva contraseña.`;
            modalBackdrop.classList.remove("hidden");
        };

        const updateMetrics = (users) => {
            const total = users.length;
            const active = users.filter(u => !u.must_change_password).length;
            const pending = users.filter(u => u.must_change_password).length;
            const samplesSum = users.reduce((acc, u) => acc + (u.total_samples || 0), 0);

            const statTotal = document.getElementById("statTotalUsers");
            const statAct = document.getElementById("statActiveUsers");
            const statPend = document.getElementById("statPendingReset");
            const statSamp = document.getElementById("statTotalSamples");

            if (statTotal) statTotal.textContent = total;
            if (statAct) statAct.textContent = active;
            if (statPend) statPend.textContent = pending;
            if (statSamp) statSamp.textContent = samplesSum;
        };

        const loadUsers = async (showLoading = true) => {
            try {
                if (showLoading) {
                    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 28px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>`;
                }
                const res = await this.apiPost("listUsers");
                cachedUsers = res.users || [];
                updateMetrics(cachedUsers);

                const q = searchInput.value.trim().toLowerCase();
                if (q) {
                    filterUsers(q);
                } else {
                    renderTable(cachedUsers);
                }
            } catch (e) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-error); padding: 24px;"><i class="fa-solid fa-triangle-exclamation"></i> Error cargando participantes: ${e.message}</td></tr>`;
            }
        };

        const filterUsers = (query) => {
            if (!query) {
                renderTable(cachedUsers);
                return;
            }
            const filtered = cachedUsers.filter(u => {
                const a = (u.alias || "").toLowerCase();
                const e = (u.email || "").toLowerCase();
                const id = (u.participant_id || "").toLowerCase();
                const reg = (u.region || "").toLowerCase();
                return a.includes(query) || e.includes(query) || id.includes(query) || reg.includes(query);
            });
            renderTable(filtered);
        };

        // Búsqueda en tiempo real
        searchInput.addEventListener("input", () => {
            filterUsers(searchInput.value.trim().toLowerCase());
        });

        // Botón actualizar
        btnRefresh.addEventListener("click", () => loadUsers(true));

        // Eventos del modal
        btnCloseModal.addEventListener("click", () => {
            modalBackdrop.classList.add("hidden");
        });

        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) modalBackdrop.classList.add("hidden");
        });

        btnModalCopyCode.addEventListener("click", () => {
            const code = modalCode.textContent.trim();
            navigator.clipboard.writeText(code).then(() => {
                btnModalCopyCode.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado!`;
                setTimeout(() => {
                    btnModalCopyCode.innerHTML = `<i class="fa-solid fa-copy"></i> Copiar Código`;
                }, 2000);
            });
        });

        btnModalCopyMessage.addEventListener("click", () => {
            const msg = modalMsg.value;
            navigator.clipboard.writeText(msg).then(() => {
                btnModalCopyMessage.innerHTML = `<i class="fa-solid fa-check"></i> ¡Mensaje Copiado!`;
                setTimeout(() => {
                    btnModalCopyMessage.innerHTML = `<i class="fa-solid fa-share-nodes"></i> Copiar Mensaje Completo`;
                }, 2000);
            });
        });

        await loadUsers(true);
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

    /**
     * Pestaña de Resumen Estadístico (Dashboard)
     */
    async renderSummaryTab(body) {
        body.innerHTML = `
            <div class="summary-dashboard">
                <div class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i> Cargando resumen estadístico...
                </div>
            </div>
        `;

        try {
            let summary;
            let isUsingMockData = false;

            try {
                const res = await this.apiPost("getSummary");
                summary = res.summary || {
                    total: 0,
                    status: { pendiente: 0, anotado: 0, validado: 0, requiere_revision: 0, rechazado: 0 },
                    splits: { train: 0, val: 0, test: 0, holdout: 0, unassigned: 0 },
                    modes: { isolated: 0, expression: 0, template: 0, continuous: 0 },
                    labels: {}
                };
            } catch (err) {
                console.warn("Error al llamar a getSummary backend, usando datos mock locales:", err);
                isUsingMockData = true;
                summary = {
                    total: 125,
                    status: { pendiente: 42, anotado: 35, validado: 38, requiere_revision: 5, rechazado: 5 },
                    splits: { train: 75, val: 20, test: 20, holdout: 10, unassigned: 0 },
                    modes: { isolated: 50, expression: 25, template: 30, continuous: 20 },
                    labels: {
                        "mañana": { total: 12, pendiente: 3, anotado: 4, validado: 5, requiere_revision: 0, rechazado: 0 },
                        "hola": { total: 15, pendiente: 2, anotado: 5, validado: 8, requiere_revision: 0, rechazado: 0 },
                        "gracias": { total: 10, pendiente: 4, anotado: 2, validado: 3, requiere_revision: 1, rechazado: 0 },
                        "por favor": { total: 8, pendiente: 1, anotado: 3, validado: 4, requiere_revision: 0, rechazado: 0 },
                        "adiós": { total: 9, pendiente: 3, anotado: 2, validado: 3, requiere_revision: 0, rechazado: 1 },
                        "perdón": { total: 6, pendiente: 2, anotado: 2, validado: 2, requiere_revision: 0, rechazado: 0 },
                        "ayuda": { total: 11, pendiente: 5, anotado: 3, validado: 3, requiere_revision: 0, rechazado: 0 },
                        "bien": { total: 14, pendiente: 4, anotado: 4, validado: 5, requiere_revision: 0, rechazado: 1 },
                        "mal": { total: 7, pendiente: 2, anotado: 1, validado: 3, requiere_revision: 1, rechazado: 0 },
                        "sí": { total: 18, pendiente: 8, anotado: 4, validado: 5, requiere_revision: 1, rechazado: 0 },
                        "no": { total: 15, pendiente: 5, anotado: 5, validado: 5, requiere_revision: 0, rechazado: 0 }
                    }
                };
            }

            const status = summary.status || {};
            const splits = summary.splits || {};
            const modes = summary.modes || {};
            const labels = summary.labels || {};

            body.innerHTML = `
                <div class="summary-dashboard">
                    ${isUsingMockData ? `
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: var(--warning); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 20px; display: flex; align-items: center; gap: 12px; font-size: 0.88rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.2rem;"></i>
                        <span><strong>Modo de Demostración:</strong> Se están mostrando datos locales de prueba porque la acción de Apps Script no está disponible en la web app actual. Actualice el script de Google Apps Script para ver sus datos reales.</span>
                    </div>
                    ` : ''}
                    
                    <!-- KPIs Grid -->
                    <div class="summary-kpis-grid">
                        <div class="kpi-card">
                            <div class="kpi-icon"><i class="fa-solid fa-database"></i></div>
                            <div class="kpi-info">
                                <h3>Total Muestras</h3>
                                <p class="kpi-value">${summary.total || 0}</p>
                            </div>
                        </div>
                        <div class="kpi-card status-pendiente">
                            <div class="kpi-icon"><i class="fa-solid fa-clock"></i></div>
                            <div class="kpi-info">
                                <h3>Pendientes</h3>
                                <p class="kpi-value">${(status.pendiente || 0)}</p>
                            </div>
                        </div>
                        <div class="kpi-card status-anotado">
                            <div class="kpi-icon"><i class="fa-solid fa-clipboard-check"></i></div>
                            <div class="kpi-info">
                                <h3>Anotadas</h3>
                                <p class="kpi-value">${(status.anotado || 0)}</p>
                            </div>
                        </div>
                        <div class="kpi-card status-validado">
                            <div class="kpi-icon"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="kpi-info">
                                <h3>Validadas</h3>
                                <p class="kpi-value">${(status.validado || 0)}</p>
                            </div>
                        </div>
                        <div class="kpi-card status-rechazado">
                            <div class="kpi-icon"><i class="fa-solid fa-ban"></i></div>
                            <div class="kpi-info">
                                <h3>Rechazadas</h3>
                                <p class="kpi-value">${(status.rechazado || 0)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Details Grid -->
                    <div class="summary-details-grid">
                        <!-- Columna Izquierda: Vocabulario -->
                        <div class="summary-card glass">
                            <div class="card-header">
                                <h3><i class="fa-solid fa-book-atlas"></i> Estadísticas por Palabra (Vocabulario)</h3>
                                <div class="search-filter-container mini">
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                    <input type="text" id="labelStatsSearch" placeholder="Buscar palabra...">
                                </div>
                            </div>
                            <div class="labels-list-scroll" id="labelsStatsList">
                                <!-- Se llena dinámicamente -->
                            </div>
                        </div>

                        <!-- Columna Derecha: Splits y Modos -->
                        <div class="summary-card glass" id="extraStatsPanel">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            `;

            // Renderizar la lista de vocabulario
            this.renderLabelsListStats(labels);

            // Escuchar buscador
            const searchInput = document.getElementById("labelStatsSearch");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    this.renderLabelsListStats(labels, term);
                });
            }

            // Renderizar splits y modos
            this.renderExtraStats(splits, modes, summary.total || 0);

        } catch (e) {
            body.innerHTML = `
                <div class="summary-dashboard">
                    <div class="error-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>Error al cargar el resumen estadístico: ${e.message || "Error desconocido"}</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renderiza la lista filtrable de palabras del vocabulario con barras de progreso relativas
     */
    renderLabelsListStats(labelsMap, searchTerm = "") {
        const listDiv = document.getElementById("labelsStatsList");
        if (!listDiv) return;

        const entries = Object.entries(labelsMap)
            .map(([word, stats]) => ({ word, ...stats }))
            .filter(item => !searchTerm || item.word.toLowerCase().includes(searchTerm));

        if (entries.length === 0) {
            listDiv.innerHTML = `
                <div class="empty-state-small" style="padding: 20px; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
                    <p>No se encontraron palabras.</p>
                </div>
            `;
            return;
        }

        // Ordenar alfabéticamente
        entries.sort((a, b) => a.word.localeCompare(b.word));

        // Encontrar valor máximo para la escala relativa
        const maxVal = Math.max(...entries.map(item => item.total), 1);

        listDiv.innerHTML = entries.map(item => {
            const widthPct = ((item.total / maxVal) * 100).toFixed(1);
            
            // Construir desglose de estados
            const details = [];
            if (item.validado > 0) details.push(`<span style="color: var(--success); font-weight: 500;"><i class="fa-solid fa-circle-check"></i> ${item.validado} val.</span>`);
            if (item.anotado > 0) details.push(`<span style="color: var(--primary); font-weight: 500;"><i class="fa-solid fa-clipboard-check"></i> ${item.anotado} anot.</span>`);
            if (item.pendiente > 0) details.push(`<span style="color: var(--warning); font-weight: 500;"><i class="fa-solid fa-clock"></i> ${item.pendiente} pend.</span>`);
            if (item.requiere_revision > 0) details.push(`<span style="color: #f97316; font-weight: 500;"><i class="fa-solid fa-triangle-exclamation"></i> ${item.requiere_revision} rev.</span>`);
            if (item.rechazado > 0) details.push(`<span style="color: #e11d48; font-weight: 500;"><i class="fa-solid fa-ban"></i> ${item.rechazado} rech.</span>`);

            const detailsStr = details.length > 0 ? details.join(" • ") : "Sin estados";

            return `
                <div class="stats-row">
                    <div class="stats-row-header">
                        <span class="label-name">${item.word}</span>
                        <span class="label-count"><strong>${item.total}</strong> en total</span>
                    </div>
                    <div class="stats-progress">
                        <div class="progress-bar-fill" style="width: ${widthPct}%; background: linear-gradient(90deg, var(--primary) 0%, var(--cyan) 100%);"></div>
                    </div>
                    <div class="stats-row-details" style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                        ${detailsStr}
                    </div>
                </div>
            `;
        }).join("");
    }

    /**
     * Renderiza las barras de progreso de splits y modos
     */
    renderExtraStats(splitsMap, modesMap, totalCount) {
        const extraDiv = document.getElementById("extraStatsPanel");
        if (!extraDiv) return;

        const total = totalCount || 1;

        const splitsData = [
            { key: "train", label: "Entrenamiento (Train)", count: splitsMap.train || 0, colorClass: "split-train-bg" },
            { key: "val", label: "Validación (Val)", count: splitsMap.val || 0, colorClass: "split-val-bg" },
            { key: "test", label: "Prueba (Test)", count: splitsMap.test || 0, colorClass: "split-test-bg" },
            { key: "holdout", label: "Holdout", count: splitsMap.holdout || 0, colorClass: "split-holdout-bg" },
            { key: "unassigned", label: "Sin Asignar", count: splitsMap.unassigned || 0, colorClass: "split-unassigned-bg" }
        ];

        const modesData = [
            { key: "isolated", label: "Aislada (Léxico)", count: modesMap.isolated || 0, colorClass: "isolated-bg" },
            { key: "expression", label: "Expresión Fija", count: modesMap.expression || 0, colorClass: "expression-bg" },
            { key: "template", label: "Plantilla Gramatical", count: modesMap.template || 0, colorClass: "plantilla-bg" },
            { key: "continuous", label: "Señas Continuas", count: modesMap.continuous || 0, colorClass: "continua-bg" }
        ];

        const renderSection = (title, icon, items) => {
            return `
                <div class="stats-section" style="margin-bottom: 28px;">
                    <h3><i class="${icon}"></i> ${title}</h3>
                    ${items.map(item => {
                        const pct = ((item.count / total) * 100).toFixed(1);
                        return `
                            <div class="stats-row" style="margin-bottom: 14px;">
                                <div class="stats-row-header">
                                    <span class="label-name">${item.label}</span>
                                    <span class="label-count"><strong>${item.count}</strong> (${pct}%)</span>
                                </div>
                                <div class="stats-progress">
                                    <div class="progress-bar-fill ${item.colorClass}" style="width: ${pct}%;"></div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `;
        };

        extraDiv.innerHTML = `
            ${renderSection("Distribución de Dataset (Splits)", "fa-solid fa-chart-pie", splitsData)}
            <div style="height: 1px; background: var(--bg-card-border); margin: 20px 0;"></div>
            ${renderSection("Formatos de Captura (Modos)", "fa-solid fa-clapperboard", modesData)}
        `;
    }
}
