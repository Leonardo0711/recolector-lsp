// Obtener IDs desde las propiedades del script (para seguridad en GitHub)
function getFolderIdBase() {
  return PropertiesService.getScriptProperties().getProperty("FOLDER_ID_BASE") || "ID_DE_CARPETA_DRIVE_AQUI";
}

function getSpreadsheetId() {
  return PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "ID_DE_SPREADSHEET_AQUI";
}

/**
 * Maneja peticiones de lectura (GET) - Reservado solo para healthCheck/ping
 */
function doGet(e) {
  try {
    initDatabase();
    return successResponse({ message: "healthCheck ok" });
  } catch (error) {
    return errorResponse(error.toString());
  }
}

/**
 * Maneja peticiones de escritura y lecturas sensibles (POST)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    initDatabase();
    
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse("No se recibieron datos.");
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    // --- ACCIÓN PÚBLICA: subida de participante (no requiere login) ---
    if (!action || action === "uploadSample") {
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const metadata = payload.metadata;
          const videoBase64 = payload.videoBase64;

          const validationError = validatePayload(metadata, videoBase64);
          if (validationError) {
            return errorResponse(validationError);
          }

          const sampleId = generateSampleId();
          metadata.sample_id = sampleId;
          metadata.annotation_status = "pendiente";
          metadata.split = "unassigned";

          const mode = metadata.capture_mode || "unknown";
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');

          const baseFolder = DriveApp.getFolderById(getFolderIdBase());
          const rawFolder = getOrCreateSubFolder(baseFolder, "raw");
          const modeFolder = getOrCreateSubFolder(rawFolder, mode);
          
          const videosRoot = getOrCreateSubFolder(modeFolder, "videos");
          const metadataRoot = getOrCreateSubFolder(modeFolder, "metadata");

          const videoDest = getOrCreateSubFolder(getOrCreateSubFolder(videosRoot, year), month);
          const metaDest = getOrCreateSubFolder(getOrCreateSubFolder(metadataRoot, year), month);

          let mimeType = 'video/webm';
          let extension = 'webm';
          if (videoBase64.indexOf('video/mp4') !== -1) {
            mimeType = 'video/mp4';
            extension = 'mp4';
          } else if (videoBase64.indexOf('video/ogg') !== -1) {
            mimeType = 'video/ogg';
            extension = 'ogv';
          }

          const videoBlob = Utilities.newBlob(
            Utilities.base64Decode(videoBase64.split(',')[1]), 
            mimeType, 
            `${sampleId}.${extension}`
          );
          const videoFile = videoDest.createFile(videoBlob);
          try {
            videoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (sharingError) {
            console.error("Error al compartir archivo: " + sharingError.toString());
          }

          metadata.video_url = videoFile.getUrl();
          const metaBlob = Utilities.newBlob(
            JSON.stringify(metadata, null, 2), 
            'application/json', 
            `${sampleId}.json`
          );
          const metaFile = metaDest.createFile(metaBlob);
          metadata.json_url = metaFile.getUrl();

          updateMasterSheets(metadata);
          
          logAudit(sampleId, "", "participant", "uploadSample", "", "pendiente", "Muestra subida por participante público.");

          return successResponse({
            message: "Muestra guardada exitosamente",
            sample_id: sampleId,
            mode: mode
          });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("El servidor está ocupado. Intente de nuevo.");
      }
    }
    
    // --- ACCIONES PROTEGIDAS (Anotadores / Administradores) ---
    const email = payload.email;
    const accessCode = payload.access_code;
    
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    
    // ACCIÓN SENSIBLE: Login
    if (action === "login") {
      const user = assertRole(email, accessCode, ["annotator", "admin"]);
      const hasLock = lock.tryLock(10000);
      if (hasLock) {
        try {
          const usersSheet = ss.getSheetByName("users");
          upsertRow(usersSheet, "email", user.email, {
            email: user.email,
            last_login: new Date().toISOString()
          });
        } finally {
          lock.releaseLock();
        }
      }
      return successResponse({
        user: {
          user_id: user.user_id,
          email: user.email,
          alias: user.alias,
          role: user.role
        }
      });
    }

    // ACCIÓN SENSIBLE: Listar muestras pendientes
    if (action === "listPendingSamples") {
      assertRole(email, accessCode, ["annotator", "admin"]);
      const samplesSheet = ss.getSheetByName("samples");
      let samples = sheetToObjects(samplesSheet);
      samples = enrichSamplesWithParticipantAlias(ss, samples);
      const filtered = samples.filter(s => {
        const status = (s.annotation_status || "").toString().trim().toLowerCase();
        return status === "" || status === "pendiente" || status === "self_annotated";
      });
      return successResponse({ samples: filtered });
    }

    // ACCIÓN SENSIBLE: Listar muestras anotadas
    if (action === "listAnnotatedSamples") {
      assertRole(email, accessCode, ["annotator", "admin"]);
      const samplesSheet = ss.getSheetByName("samples");
      let samples = sheetToObjects(samplesSheet);
      samples = enrichSamplesWithParticipantAlias(ss, samples);
      const filtered = samples.filter(s => {
        const status = (s.annotation_status || "").toString().trim().toLowerCase();
        return status === "anotado" || status === "requiere_revision";
      });
      return successResponse({ samples: filtered });
    }

    // ACCIÓN SENSIBLE: Listar muestras validadas
    if (action === "listValidatedSamples") {
      assertRole(email, accessCode, ["admin"]);
      const samplesSheet = ss.getSheetByName("samples");
      let samples = sheetToObjects(samplesSheet);
      samples = enrichSamplesWithParticipantAlias(ss, samples);
      const filtered = samples.filter(s => {
        const status = (s.annotation_status || "").toString().trim().toLowerCase();
        return status === "validado" || status === "rechazado";
      });
      return successResponse({ samples: filtered });
    }

    // ACCIÓN SENSIBLE: Obtener detalle de muestra
    if (action === "getSampleDetail") {
      assertRole(email, accessCode, ["annotator", "admin"]);
      const sampleId = payload.sample_id;
      if (!sampleId) return errorResponse("Falta sample_id.");
      
      const samplesSheet = ss.getSheetByName("samples");
      const samples = sheetToObjects(samplesSheet);
      const sample = samples.find(s => s.sample_id === sampleId);
      if (!sample) return errorResponse("Muestra no encontrada.");
      
      const participantsSheet = ss.getSheetByName("participants");
      if (participantsSheet) {
        const participants = sheetToObjects(participantsSheet);
        const participant = participants.find(p => p.participant_id === sample.participant_id);
        if (participant) {
          sample.participant_alias = participant.alias || "";
        }
      }
      
      const annotationsSheet = ss.getSheetByName("annotations");
      const annotations = sheetToObjects(annotationsSheet);
      const annotation = annotations.find(a => a.sample_id === sampleId) || null;
      
      return successResponse({ sample, annotation });
    }

    // ACCIÓN SENSIBLE: Obtener bytes de video en base64
    if (action === "getVideoBytes") {
      assertRole(email, accessCode, ["annotator", "admin"]);
      const fileId = payload.fileId;
      if (!fileId) return errorResponse("Falta fileId.");
      try {
        const file = DriveApp.getFileById(fileId);
        const mimeType = file.getMimeType();
        const base64 = Utilities.base64Encode(file.getBlob().getBytes());
        return successResponse({ base64: base64, mimeType: mimeType });
      } catch (err) {
        return errorResponse("Error al leer archivo de video: " + err.toString());
      }
    }

    // ACCIÓN SENSIBLE: Listar usuarios
    if (action === "listUsers") {
      assertRole(email, accessCode, ["admin"]);
      const usersSheet = ss.getSheetByName("users");
      const users = sheetToObjects(usersSheet);
      const sanitized = users.map(u => ({
        user_id: u.user_id,
        email: u.email,
        alias: u.alias,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        last_login: u.last_login
      }));
      return successResponse({ users: sanitized });
    }

    // ACCIÓN SENSIBLE: Exportar dataset
    if (action === "exportDataset") {
      const user = assertRole(email, accessCode, ["admin"]);
      
      const samplesSheet = ss.getSheetByName("samples");
      const annotationsSheet = ss.getSheetByName("annotations");
      
      const samples = sheetToObjects(samplesSheet);
      const annotations = sheetToObjects(annotationsSheet);
      
      const includePending = payload.include_pending === true || payload.include_pending === "true";
      const includeRejected = payload.include_rejected === true || payload.include_rejected === "true";
      const includeNonIdeal = payload.include_non_ideal === true || payload.include_non_ideal === "true";
      
      const exported = [];
      
      samples.forEach(sample => {
        const ann = annotations.find(a => a.sample_id === sample.sample_id) || {};
        
        // Fuente principal annotations.estado_anotacion y samples.annotation_status como fallback
        const status = (ann.estado_anotacion || sample.annotation_status || "").toString().trim().toLowerCase();
        const split = (sample.split || "").toString().trim().toLowerCase();
        const quality = (ann.calidad_visual || "").toString().trim().toLowerCase();
        const linguistic = (ann.aceptabilidad_linguistica || "").toString().trim().toLowerCase();
        
        let keep = true;
        
        // 1. Filtrado por estado
        if (status !== "validado") {
          if (!includePending && (status === "anotado" || status === "pendiente" || status === "requiere_revision" || status === "")) {
            keep = false;
          }
          if (!includeRejected && status === "rechazado") {
            keep = false;
          }
        }
        
        // 2. Filtrado por split
        if (split === "" || split === "unassigned") {
          if (!includePending) {
            keep = false;
          }
        }
        
        // 3. Filtrado por calidad
        if (!includeNonIdeal && status === "validado") {
          if (quality === "mala" || linguistic !== "aceptable") {
            keep = false;
          }
        }
        
        if (keep) {
          exported.push({
            sample_id: sample.sample_id,
            participant_id: sample.participant_id,
            capture_mode: sample.capture_mode,
            prompt_text: sample.prompt_text,
            label: sample.label,
            video_url: sample.video_url,
            duration_sec: sample.duration_sec,
            split: sample.split || "unassigned",
            annotation: {
              tipo_muestra: ann.tipo_muestra || "",
              glosa_final: ann.glosa_final || "",
              secuencia_glosas: ann.secuencia_glosas || "",
              segmentacion_glosas: ann.segmentacion_glosas || "",
              texto_es_final: ann.texto_es_final || "",
              intencion_comunicativa: ann.intencion_comunicativa || "",
              aceptabilidad_linguistica: ann.aceptabilidad_linguistica || "",
              calidad_visual: ann.calidad_visual || "",
              estado_anotacion: status || "pendiente"
            }
          });
        }
      });
      
      logAudit("", "", user.user_id, "exportDataset", "", "", `Exportadas ${exported.length} muestras. include_pending=${includePending}, include_rejected=${includeRejected}, include_non_ideal=${includeNonIdeal}`);
      
      return successResponse({ dataset: exported });
    }
    
    // ACCIÓN PROTEGIDA: Guardar anotación
    if (action === "saveAnnotation") {
      const user = assertRole(email, accessCode, ["annotator", "admin"]);
      const annotationData = payload.annotation;
      
      if (!annotationData || !annotationData.sample_id) {
        return errorResponse("Faltan datos de la anotación o el sample_id.");
      }
      
      const validationError = validateAnnotationPayload(annotationData);
      if (validationError) {
        return errorResponse(validationError);
      }
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const annotationsSheet = ss.getSheetByName("annotations");
          const samplesSheet = ss.getSheetByName("samples");
          
          const existingAnnotations = sheetToObjects(annotationsSheet);
          const existingAnn = existingAnnotations.find(a => a.sample_id === annotationData.sample_id);
          const oldStatus = existingAnn ? existingAnn.estado_anotacion : "pendiente";
          const annotationId = existingAnn ? existingAnn.annotation_id : "ANN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          
          const fullAnnotation = {
            ...existingAnn,
            ...annotationData,
            annotation_id: annotationId,
            annotator_id: user.user_id,
            annotation_datetime: new Date().toISOString(),
            estado_anotacion: "anotado"
          };
          
          upsertRow(annotationsSheet, "sample_id", annotationData.sample_id, fullAnnotation);
          
          upsertRow(samplesSheet, "sample_id", annotationData.sample_id, {
            sample_id: annotationData.sample_id,
            annotation_status: "anotado"
          });
          
          logAudit(annotationData.sample_id, annotationId, user.user_id, "saveAnnotation", oldStatus, "anotado", annotationData.observacion || "");
          
          return successResponse({ message: "Anotación guardada como anotada.", annotation_id: annotationId });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Requerir revisión
    if (action === "markRequiresReview") {
      const user = assertRole(email, accessCode, ["annotator", "admin"]);
      const sampleId = payload.sample_id;
      const notes = payload.observacion;
      
      if (!sampleId) return errorResponse("Falta sample_id.");
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const annotationsSheet = ss.getSheetByName("annotations");
          const samplesSheet = ss.getSheetByName("samples");
          
          const annotations = sheetToObjects(annotationsSheet);
          const ann = annotations.find(a => a.sample_id === sampleId) || {};
          const oldStatus = ann.estado_anotacion || "pendiente";
          const annotationId = ann.annotation_id || "ANN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          
          const updatedAnn = {
            ...ann,
            annotation_id: annotationId,
            sample_id: sampleId,
            annotator_id: user.user_id,
            annotation_datetime: new Date().toISOString(),
            estado_anotacion: "requiere_revision",
            observacion: notes || ann.observacion || ""
          };
          
          upsertRow(annotationsSheet, "sample_id", sampleId, updatedAnn);
          
          upsertRow(samplesSheet, "sample_id", sampleId, {
            sample_id: sampleId,
            annotation_status: "requiere_revision"
          });
          
          logAudit(sampleId, annotationId, user.user_id, "markRequiresReview", oldStatus, "requiere_revision", notes || "");
          
          return successResponse({ message: "Muestra marcada para revisión.", annotation_id: annotationId });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Validar anotación (Admin)
    if (action === "validateAnnotation") {
      const user = assertRole(email, accessCode, ["admin"]);
      const sampleId = payload.sample_id;
      const adminNotes = payload.admin_notes;
      
      if (!sampleId) return errorResponse("Falta sample_id.");
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const annotationsSheet = ss.getSheetByName("annotations");
          const samplesSheet = ss.getSheetByName("samples");
          
          const annotations = sheetToObjects(annotationsSheet);
          const ann = annotations.find(a => a.sample_id === sampleId);
          if (!ann) return errorResponse("No existe anotación para validar. Debe anotarse primero.");
          
          if (!ann.texto_es_final || ann.texto_es_final.trim() === "") {
            return errorResponse("No se puede validar sin la traducción final (texto_es_final).");
          }
          
          if (ann.calidad_visual === "mala") {
            return errorResponse("No se puede validar una muestra con calidad visual 'mala'.");
          }
          if (ann.aceptabilidad_linguistica !== "aceptable") {
            return errorResponse("No se puede validar una muestra con aceptabilidad lingüística distinta de 'aceptable'.");
          }
          
          const oldStatus = ann.estado_anotacion || "pendiente";
          
          const updatedAnn = {
            ...ann,
            estado_anotacion: "validado",
            admin_notes: adminNotes || ann.admin_notes || "",
            reviewed_by: user.user_id,
            review_datetime: new Date().toISOString()
          };
          
          upsertRow(annotationsSheet, "sample_id", sampleId, updatedAnn);
          
          upsertRow(samplesSheet, "sample_id", sampleId, {
            sample_id: sampleId,
            annotation_status: "validado"
          });
          
          logAudit(sampleId, ann.annotation_id, user.user_id, "validateAnnotation", oldStatus, "validado", adminNotes || "");
          
          return successResponse({ message: "Muestra validada exitosamente." });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Rechazar anotación (Admin)
    if (action === "rejectAnnotation") {
      const user = assertRole(email, accessCode, ["admin"]);
      const sampleId = payload.sample_id;
      const motivoRechazo = payload.motivo_rechazo;
      const adminNotes = payload.admin_notes;
      
      if (!sampleId) return errorResponse("Falta sample_id.");
      if (!motivoRechazo) return errorResponse("Falta el motivo del rechazo.");
      
      // Validar motivo_rechazo contra lista cerrada
      const allowedMotivos = [
        "video_borroso", "manos_fuera_de_cuadro", "rostro_no_visible", "sena_incompleta",
        "glosa_incorrecta", "no_corresponde_prompt", "problema_tecnico", "otro"
      ];
      if (!allowedMotivos.includes(motivoRechazo)) {
        return errorResponse("Motivo de rechazo inválido.");
      }
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const annotationsSheet = ss.getSheetByName("annotations");
          const samplesSheet = ss.getSheetByName("samples");
          
          const annotations = sheetToObjects(annotationsSheet);
          const ann = annotations.find(a => a.sample_id === sampleId) || {};
          const oldStatus = ann.estado_anotacion || "pendiente";
          const annotationId = ann.annotation_id || "ANN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          
          const updatedAnn = {
            ...ann,
            annotation_id: annotationId,
            sample_id: sampleId,
            estado_anotacion: "rechazado",
            motivo_rechazo: motivoRechazo,
            admin_notes: adminNotes || ann.admin_notes || "",
            reviewed_by: user.user_id,
            review_datetime: new Date().toISOString()
          };
          
          upsertRow(annotationsSheet, "sample_id", sampleId, updatedAnn);
          
          upsertRow(samplesSheet, "sample_id", sampleId, {
            sample_id: sampleId,
            annotation_status: "rechazado"
          });
          
          logAudit(sampleId, annotationId, user.user_id, "rejectAnnotation", oldStatus, "rechazado", `Motivo: ${motivoRechazo}. Notas: ${adminNotes || ""}`);
          
          return successResponse({ message: "Muestra rechazada." });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Devolver a revisión (Admin)
    if (action === "returnToReview") {
      const user = assertRole(email, accessCode, ["admin"]);
      const sampleId = payload.sample_id;
      const adminNotes = payload.admin_notes;
      
      if (!sampleId) return errorResponse("Falta sample_id.");
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const annotationsSheet = ss.getSheetByName("annotations");
          const samplesSheet = ss.getSheetByName("samples");
          
          const annotations = sheetToObjects(annotationsSheet);
          const ann = annotations.find(a => a.sample_id === sampleId) || {};
          const oldStatus = ann.estado_anotacion || "pendiente";
          const annotationId = ann.annotation_id || "ANN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          
          const updatedAnn = {
            ...ann,
            annotation_id: annotationId,
            sample_id: sampleId,
            estado_anotacion: "pendiente",
            admin_notes: adminNotes || ann.admin_notes || "",
            reviewed_by: user.user_id,
            review_datetime: new Date().toISOString()
          };
          
          upsertRow(annotationsSheet, "sample_id", sampleId, updatedAnn);
          
          upsertRow(samplesSheet, "sample_id", sampleId, {
            sample_id: sampleId,
            annotation_status: "pendiente"
          });
          
          logAudit(sampleId, annotationId, user.user_id, "returnToReview", oldStatus, "pendiente", adminNotes || "");
          
          return successResponse({ message: "Muestra devuelta a estado pendiente de revisión." });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Actualizar conjunto/split (Admin)
    if (action === "updateSampleSplit") {
      const user = assertRole(email, accessCode, ["admin"]);
      const sampleId = payload.sample_id;
      const split = payload.split;
      
      if (!sampleId) return errorResponse("Falta sample_id.");
      if (!split) return errorResponse("Falta split.");
      
      const allowedSplits = ["train", "val", "test", "holdout", "unassigned"];
      if (!allowedSplits.includes(split.toLowerCase())) {
        return errorResponse("Split inválido. Debe ser: train, val, test, holdout o unassigned.");
      }
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const samplesSheet = ss.getSheetByName("samples");
          
          const samples = sheetToObjects(samplesSheet);
          const sample = samples.find(s => s.sample_id === sampleId);
          if (!sample) return errorResponse("Muestra no encontrada.");
          
          const oldSplit = sample.split || "unassigned";
          
          upsertRow(samplesSheet, "sample_id", sampleId, {
            sample_id: sampleId,
            split: split.toLowerCase()
          });
          
          logAudit(sampleId, "", user.user_id, "updateSampleSplit", oldSplit, split.toLowerCase(), `Split actualizado por administrador.`);
          
          return successResponse({ message: `Split actualizado a ${split.toLowerCase()} con éxito.` });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    // ACCIÓN PROTEGIDA: Guardar/editar usuario (Admin)
    if (action === "upsertUser") {
      const user = assertRole(email, accessCode, ["admin"]);
      const userData = payload.userData;
      
      if (!userData || !userData.email) {
        return errorResponse("Faltan datos del usuario.");
      }
      
      const targetEmail = userData.email.trim().toLowerCase();
      const allowedRoles = ["participant", "annotator", "admin"];
      if (userData.role && !allowedRoles.includes(userData.role)) {
        return errorResponse("Rol inválido.");
      }
      
      const allowedStatuses = ["active", "inactive"];
      if (userData.status && !allowedStatuses.includes(userData.status)) {
        return errorResponse("Estado de usuario inválido.");
      }
      
      const hasLock = lock.tryLock(15000);
      if (hasLock) {
        try {
          const usersSheet = ss.getSheetByName("users");
          const users = sheetToObjects(usersSheet);
          const existingUser = users.find(u => u.email.toLowerCase() === targetEmail);
          
          if (!existingUser) {
            if (!userData.access_code || userData.access_code.trim() === "") {
              return errorResponse("El código de acceso (access_code) es obligatorio para registrar un usuario nuevo.");
            }
          }
          
          const userId = existingUser ? existingUser.user_id : "USR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          const createdAt = existingUser ? existingUser.created_at : new Date().toISOString();
          
          const fullUser = {
            ...existingUser,
            user_id: userId,
            email: targetEmail,
            alias: userData.alias || (existingUser ? existingUser.alias : ""),
            role: userData.role || (existingUser ? existingUser.role : "annotator"),
            status: userData.status || (existingUser ? existingUser.status : "active"),
            access_code: userData.access_code || (existingUser ? existingUser.access_code : ""),
            created_at: createdAt
          };
          
          upsertRow(usersSheet, "email", targetEmail, fullUser);
          
          logAudit("", "", user.user_id, "upsertUser", existingUser ? existingUser.role : "", fullUser.role, `Upsert usuario ${targetEmail}. Estado: ${fullUser.status}`);
          
          return successResponse({ message: "Usuario guardado exitosamente.", user_id: userId });
        } finally {
          lock.releaseLock();
        }
      } else {
        return errorResponse("Servidor ocupado. Intente nuevamente.");
      }
    }
    
    return errorResponse("Acción POST desconocida o no permitida.");
    
  } catch (error) {
    return errorResponse(error.toString());
  }
}

/**
 * Validaciones del payload de subida del grabador público
 */
function validatePayload(m, video) {
  if (!m.participant_id) return "Falta participant_id";
  if (!m.capture_mode) return "Falta capture_mode";
  if (!m.prompt_id) return "Falta prompt_id";
  
  if (!m.consent_research) return "Falta consentimiento: investigación";
  if (!m.consent_training) return "Falta consentimiento: entrenamiento";
  if (!m.consent_storage) return "Falta consentimiento: almacenamiento";
  if (!m.consent_age) return "Falta consentimiento: mayoría de edad";
  if (!m.age) return "Falta validación de edad del participante";

  const duration = m.duration_sec || 0;
  if (m.capture_mode === "isolated" && duration < 1) return "Video demasiado corto para seña aislada";
  if (m.capture_mode === "continuous" && duration < 5) return "Video demasiado corto para signing continuo";

  if (!video || video.length < 1000) return "Video corrupto";
  
  return null;
}

/**
 * Validaciones estrictas del formulario de anotación
 */
function validateAnnotationPayload(ann) {
  const allowedTipos = ["aislada", "expresion", "plantilla", "continua"];
  if (!ann.tipo_muestra || !allowedTipos.includes(ann.tipo_muestra)) {
    return "Tipo de muestra inválido. Debe ser una de: " + allowedTipos.join(", ");
  }
  
  if (ann.tipo_muestra === "aislada" || ann.tipo_muestra === "expresion") {
    if (!ann.glosa_final || ann.glosa_final.trim() === "") {
      return "Para muestras aisladas o de expresión, el campo 'glosa_final' es obligatorio.";
    }
    if (!ann.texto_es_final || ann.texto_es_final.trim() === "") {
      return "El campo 'texto_es_final' (traducción al español) es obligatorio.";
    }
  }
  
  if (ann.tipo_muestra === "plantilla" || ann.tipo_muestra === "continua") {
    if (!ann.secuencia_glosas || ann.secuencia_glosas.trim() === "") {
      return "Para muestras de plantilla o continuas, el campo 'secuencia_glosas' es obligatorio.";
    }
    if (!ann.texto_es_final || ann.texto_es_final.trim() === "") {
      return "El campo 'texto_es_final' (traducción al español) es obligatorio.";
    }
  }
  
  if (!ann.intencion_comunicativa || ann.intencion_comunicativa.trim() === "") {
    return "El campo 'intencion_comunicativa' es obligatorio.";
  }
  const allowedIntenciones = [
    "saludo", "despedida", "cortesia", "solicitud", "pregunta", "respuesta", 
    "necesidad", "emergencia", "emocion", "informacion_personal", "ubicacion", "tiempo", "otro"
  ];
  if (!allowedIntenciones.includes(ann.intencion_comunicativa)) {
    return "Intención comunicativa inválida.";
  }
  
  if (!ann.aceptabilidad_linguistica || ann.aceptabilidad_linguistica.trim() === "") {
    return "El campo 'aceptabilidad_linguistica' es obligatorio.";
  }
  const allowedAceptabilidad = ["aceptable", "dudosa", "no_aceptable"];
  if (!allowedAceptabilidad.includes(ann.aceptabilidad_linguistica)) {
    return "Aceptabilidad lingüística inválida.";
  }
  
  if (!ann.calidad_visual || ann.calidad_visual.trim() === "") {
    return "El campo 'calidad_visual' es obligatorio.";
  }
  const allowedCalidad = ["buena", "regular", "mala"];
  if (!allowedCalidad.includes(ann.calidad_visual)) {
    return "Calidad visual inválida.";
  }
  
  return null;
}

/**
 * Genera ID único de muestra
 */
function generateSampleId() {
  const d = new Date();
  const datePart = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LSP-${datePart}-${randomPart}`;
}

/**
 * Actualiza hojas maestras de participante y muestra
 */
function updateMasterSheets(m) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  
  const samplesSheet = getOrCreateSheet(ss, "samples");
  const sampleHeaders = [
    "sample_id", "participant_id", "session_id", "capture_mode", 
    "label_id", "label", "prompt_id", "prompt_text", 
    "produced_text_es", "produced_text_es_normalized", "gloss_reference",
    "repetition", "capture_datetime", "duration_sec", "width", "height",
    "hands_visible", "face_visible", "body_visible", "occlusion_level",
    "linguistic_acceptability", "prompt_adherence",
    "annotation_status", "split", "failed_capture", 
    "consent_age", "app_version", "dataset_phase", "video_url", "json_url"
  ];
  
  if (samplesSheet.getLastRow() === 0) {
    samplesSheet.appendRow(sampleHeaders);
  }
  upsertRow(samplesSheet, "sample_id", m.sample_id, m);

  const participantsSheet = getOrCreateSheet(ss, "participants");
  const partHeaders = [
    "participant_id", "alias", "age", "region", "dominant_hand", 
    "lsp_level", "participant_type", "consent_research", "consent_training", "consent_storage", "consent_age"
  ];
  if (participantsSheet.getLastRow() === 0) {
    participantsSheet.appendRow(partHeaders);
  }
  
  upsertRow(participantsSheet, "participant_id", m.participant_id, m);
}

/**
 * Inicialización segura y bootstrap de administrador
 */
function initDatabase() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  
  const userHeaders = ["user_id", "email", "alias", "role", "status", "created_at", "last_login", "access_code"];
  const annotationHeaders = [
    "annotation_id", "sample_id", "annotator_id", "annotation_datetime", "tipo_muestra", 
    "glosa_final", "secuencia_glosas", "segmentacion_glosas", "texto_es_final", "intencion_comunicativa", 
    "aceptabilidad_linguistica", "calidad_visual", "estado_anotacion", "motivo_rechazo", 
    "observacion", "admin_notes", "reviewed_by", "review_datetime"
  ];
  const auditHeaders = ["audit_id", "sample_id", "annotation_id", "user_id", "action", "old_status", "new_status", "timestamp", "notes"];
  
  const samplesHeaders = [
    "sample_id", "participant_id", "session_id", "capture_mode", 
    "label_id", "label", "prompt_id", "prompt_text", 
    "produced_text_es", "produced_text_es_normalized", "gloss_reference",
    "repetition", "capture_datetime", "duration_sec", "width", "height",
    "hands_visible", "face_visible", "body_visible", "occlusion_level",
    "linguistic_acceptability", "prompt_adherence",
    "annotation_status", "split", "failed_capture", 
    "consent_age", "app_version", "dataset_phase", "video_url", "json_url"
  ];

  const usersSheet = getOrCreateSheet(ss, "users");
  syncHeaders(usersSheet, userHeaders);
  
  const annotationsSheet = getOrCreateSheet(ss, "annotations");
  syncHeaders(annotationsSheet, annotationHeaders);
  
  const auditSheet = getOrCreateSheet(ss, "annotation_audit");
  syncHeaders(auditSheet, auditHeaders);

  const samplesSheet = getOrCreateSheet(ss, "samples");
  syncHeaders(samplesSheet, samplesHeaders);

  const users = sheetToObjects(usersSheet);
  const hasAdmin = users.some(u => u.role === "admin" && u.status === "active");
  if (!hasAdmin) {
    const props = PropertiesService.getScriptProperties();
    const bootstrapEmail = props.getProperty("BOOTSTRAP_ADMIN_EMAIL");
    const bootstrapCode = props.getProperty("BOOTSTRAP_ADMIN_CODE");
    
    if (!bootstrapEmail || !bootstrapCode || bootstrapEmail.trim() === "" || bootstrapCode.trim() === "") {
      throw new Error("Sistema no inicializado. Faltan variables de entorno BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_CODE.");
    }
    
    const newAdmin = {
      user_id: "USR-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      email: bootstrapEmail.trim().toLowerCase(),
      alias: "System Admin",
      role: "admin",
      status: "active",
      created_at: new Date().toISOString(),
      last_login: "",
      access_code: bootstrapCode.trim()
    };
    upsertRow(usersSheet, "email", newAdmin.email, newAdmin);
  }
}

/**
 * Valida credenciales, rol y estado de usuario
 */
function assertRole(email, accessCode, allowedRoles) {
  if (!email || !accessCode) {
    throw new Error("Faltan credenciales (email o código de acceso) en la solicitud.");
  }
  
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const usersSheet = ss.getSheetByName("users");
  if (!usersSheet) {
    throw new Error("Base de datos de usuarios no inicializada.");
  }
  
  const users = sheetToObjects(usersSheet);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  
  if (!user) {
    throw new Error("Usuario no registrado.");
  }
  
  if (user.status !== "active") {
    throw new Error("Usuario inactivo en el sistema.");
  }
  
  if (user.access_code.toString().trim() !== accessCode.toString().trim()) {
    throw new Error("Código de acceso incorrecto.");
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Permisos insuficientes para el rol: " + user.role);
  }
  
  return user;
}

/**
 * Bitácora de cambios para auditorías
 */
function logAudit(sampleId, annotationId, userId, action, oldStatus, newStatus, notes) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const auditSheet = ss.getSheetByName("annotation_audit");
  if (!auditSheet) return;
  
  const auditRow = {
    audit_id: "AUD-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    sample_id: sampleId || "",
    annotation_id: annotationId || "",
    user_id: userId || "system",
    action: action,
    old_status: oldStatus || "",
    new_status: newStatus || "",
    timestamp: new Date().toISOString(),
    notes: notes || ""
  };
  
  upsertRow(auditSheet, "audit_id", auditRow.audit_id, auditRow);
}

/**
 * Convierte una hoja a una lista de objetos JS
 */
function sheetToObjects(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

/**
 * Retorna o crea una pestaña en el Spreadsheet
 */
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Retorna o crea un subdirectorio en Drive
 */
function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

/**
 * Busca fila de clave-valor en una columna
 */
function findRowIndexByKey(sheet, keyColumnName, keyValue) {
  if (sheet.getLastRow() < 2) return -1;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyColIdx = headers.indexOf(keyColumnName);
  if (keyColIdx === -1) return -1;
  
  const values = sheet.getRange(2, keyColIdx + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0].toString() === keyValue.toString()) {
      return i + 2; // Fila indexada en base 1, considerando cabecera
    }
  }
  return -1;
}

/**
 * Modifica o inserta una fila según su clave única
 */
function upsertRow(sheet, keyColumnName, keyValue, dataObject) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowIndex = findRowIndexByKey(sheet, keyColumnName, keyValue);
  
  if (rowIndex !== -1) {
    headers.forEach((h, idx) => {
      if (dataObject[h] !== undefined) {
        sheet.getRange(rowIndex, idx + 1).setValue(dataObject[h]);
      }
    });
  } else {
    const newRow = headers.map(h => dataObject[h] !== undefined ? dataObject[h] : "");
    sheet.appendRow(newRow);
  }
}

/**
 * Asegura que todas las columnas esperadas existan en la cabecera de la hoja
 */
function syncHeaders(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }
  const headersRange = sheet.getRange(1, 1, 1, lastCol);
  const actualHeaders = headersRange.getValues()[0].map(h => h.toString().trim());
  const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
  if (missingHeaders.length > 0) {
    const newHeaders = [...actualHeaders, ...missingHeaders];
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
  }
}

/**
 * Enriquece los objetos de muestra con el alias del participante
 */
function enrichSamplesWithParticipantAlias(ss, samples) {
  const participantsSheet = ss.getSheetByName("participants");
  if (!participantsSheet) return samples;
  const participants = sheetToObjects(participantsSheet);
  const partMap = {};
  participants.forEach(p => {
    partMap[p.participant_id] = p.alias || "";
  });
  samples.forEach(s => {
    s.participant_alias = partMap[s.participant_id] || "";
  });
  return samples;
}

/**
 * Formatea respuesta exitosa
 */
function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Formatea respuesta errónea
 */
function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
