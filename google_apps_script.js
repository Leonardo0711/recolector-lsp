/**
 * RECOLECTOR DE LENGUAJE DE SEÑAS PERUANO - v3.0 (Científico)
 * Backend para 4 Bloques (Isolated, Expressions, Templates, Continuous)
 */

const FOLDER_ID_BASE = "TU_ID_DE_CARPETA_RAIZ"; // ID de la carpeta 'dataset'
const SPREADSHEET_ID = "TU_ID_DE_SPREADSHEET"; // ID de la hoja de cálculo

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse("No data received");
    }

    const data = JSON.parse(e.postData.contents);
    const metadata = data.metadata;
    const videoBase64 = data.videoBase64;

    // --- VALIDACIÓN DE INTEGRIDAD ---
    const validationError = validatePayload(metadata, videoBase64);
    if (validationError) {
      return errorResponse(validationError);
    }

    // 1. Generar sample_id
    const sampleId = generateSampleId();
    metadata.sample_id = sampleId;

    // 2. Estructura de Carpetas Geográfica/Temporal/Modo
    // Estructura: raw / {capture_mode} / {videos|metadata} / YYYY / MM
    const mode = metadata.capture_mode || "unknown";
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const baseFolder = DriveApp.getFolderById(FOLDER_ID_BASE);
    const rawFolder = getOrCreateSubFolder(baseFolder, "raw");
    const modeFolder = getOrCreateSubFolder(rawFolder, mode);
    
    const videosRoot = getOrCreateSubFolder(modeFolder, "videos");
    const metadataRoot = getOrCreateSubFolder(modeFolder, "metadata");

    const videoDest = getOrCreateSubFolder(getOrCreateSubFolder(videosRoot, year), month);
    const metaDest = getOrCreateSubFolder(getOrCreateSubFolder(metadataRoot, year), month);

    // 3. Guardar Video
    const videoBlob = Utilities.newBlob(
      Utilities.base64Decode(videoBase64.split(',')[1]), 
      'video/webm', 
      `${sampleId}.webm`
    );
    const videoFile = videoDest.createFile(videoBlob);

    // 4. Guardar Metadatos
    metadata.video_url = videoFile.getUrl();
    const metaBlob = Utilities.newBlob(
      JSON.stringify(metadata, null, 2), 
      'application/json', 
      `${sampleId}.json`
    );
    const metaFile = metaDest.createFile(metaBlob);
    metadata.json_url = metaFile.getUrl();

    // 5. Actualizar Índices Maestros (Multi-pestaña)
    updateMasterSheets(metadata);

    return successResponse({
      message: "Muestra guardada exitosamente",
      sample_id: sampleId,
      mode: mode
    });

  } catch (error) {
    return errorResponse(error.toString());
  }
}

function validatePayload(m, video) {
  if (!m.participant_id) return "Falta participant_id";
  if (!m.capture_mode) return "Falta capture_mode";
  if (!m.prompt_id) return "Falta prompt_id";
  
  // Validaciones Éticas y Cumplimiento
  if (!m.consent_research) return "Falta consentimiento: investigación";
  if (!m.consent_training) return "Falta consentimiento: entrenamiento";
  if (!m.consent_storage) return "Falta consentimiento: almacenamiento";
  if (!m.age) return "Falta validación de edad del participante";

  // Validaciones por modo (Duración mínima sugerida)
  const duration = m.duration_sec || 0;
  if (m.capture_mode === "isolated" && duration < 1) return "Video demasiado corto para seña aislada";
  if (m.capture_mode === "continuous" && duration < 5) return "Video demasiado corto para signing continuo";

  if (!video || video.length < 1000) return "Video corrupto";
  
  return null;
}

function generateSampleId() {
  const d = new Date();
  const datePart = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LSP-${datePart}-${randomPart}`;
}

function updateMasterSheets(m) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Pestaña 'samples' (Muestras brutas)
  const samplesSheet = getOrCreateSheet(ss, "samples");
  const sampleHeaders = [
    "sample_id", "participant_id", "session_id", "capture_mode", 
    "label_id", "label", "prompt_id", "prompt_text", 
    "repetition", "capture_datetime", "duration_sec", "width", "height",
    "failed_capture", "app_version", "dataset_phase", "video_url", "json_url"
  ];
  appendDataToSheet(samplesSheet, sampleHeaders, m);

  // 2. Pestaña 'participants' (Perfiles)
  const participantsSheet = getOrCreateSheet(ss, "participants");
  const partHeaders = [
    "participant_id", "alias", "age", "region", "dominant_hand", 
    "lsp_level", "participant_type", "consent_research", "consent_training", "consent_storage"
  ];
  // Solo agregar si el participante no existe ya (Búsqueda básica por ID)
  if (!findInSheet(participantsSheet, m.participant_id, 1)) {
    appendDataToSheet(participantsSheet, partHeaders, m.participant || m);
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function appendDataToSheet(sheet, headers, data) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
}

function findInSheet(sheet, value, column) {
  if (sheet.getLastRow() < 2) return false;
  const values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues();
  return values.some(row => row[0] === value);
}

function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
