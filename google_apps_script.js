/**
 * RECOLECTOR DE LENGUAJE DE SEÑAS PERUANO - v2.2 (Profesional)
 * Backend Serverless para Google Drive & Sheets
 */

const FOLDER_ID_BASE = "TU_ID_DE_CARPETA_RAIZ"; // ID de la carpeta 'dataset'
const SPREADSHEET_ID = "TU_ID_DE_SPREADSHEET"; // ID de la hoja de cálculo para el índice

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse("No data received");
    }

    const data = JSON.parse(e.postData.contents);
    const metadata = data.metadata;
    const videoBase64 = data.videoBase64;

    // --- VALIDACIÓN DE INTEGRIDAD (Defensa del Dataset) ---
    const validationError = validatePayload(metadata, videoBase64);
    if (validationError) {
      return errorResponse(validationError);
    }

    // 1. Generar sample_id en el servidor para garantizar unicidad
    const sampleId = generateSampleId();
    metadata.sample_id = sampleId;

    // 2. Obtener carpetas de destino (Estructura: Raw -> Videos/Metadata -> YYYY -> MM)
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const baseFolder = DriveApp.getFolderById(FOLDER_ID_BASE);
    const rawFolder = getOrCreateSubFolder(baseFolder, "raw");
    
    // Carpetas de Archivos
    const videosRoot = getOrCreateSubFolder(rawFolder, "videos");
    const metadataRoot = getOrCreateSubFolder(rawFolder, "metadata");

    const videoFolder = getOrCreateSubFolder(getOrCreateSubFolder(videosRoot, year), month);
    const metaFolder = getOrCreateSubFolder(getOrCreateSubFolder(metadataRoot, year), month);

    // 3. Guardar Video (.webm)
    const videoBlob = Utilities.newBlob(
      Utilities.base64Decode(videoBase64.split(',')[1]), 
      'video/webm', 
      `${sampleId}.webm`
    );
    const videoFile = videoFolder.createFile(videoBlob);

    // 4. Guardar Metadatos (.json)
    metadata.video_url = videoFile.getUrl();
    const metaBlob = Utilities.newBlob(
      JSON.stringify(metadata, null, 2), 
      'application/json', 
      `${sampleId}.json`
    );
    const metaFile = metaFolder.createFile(metaBlob);
    metadata.json_url = metaFile.getUrl();

    // 5. Actualizar Índice Maestro (Google Sheets)
    updateMasterIndex(metadata);

    return successResponse({
      message: "Muestra guardada exitosamente",
      sample_id: sampleId,
      video_url: metadata.video_url
    });

  } catch (error) {
    return errorResponse(error.toString());
  }
}

/**
 * Valida que los metadatos críticos y el video cumplan con los requisitos mínimos.
 */
function validatePayload(m, video) {
  if (!m.participant_id) return "Falta participant_id (UUID)";
  if (!m.label_id) return "Falta label_id";
  if (!m.age) return "Falta rango de edad";
  
  // Consentimientos obligatorios
  if (m.consent_research !== true || m.consent_training !== true || m.consent_storage !== true) {
    return "No se han aceptado todos los consentimientos éticos";
  }

  // Métricas técnicas
  if (!m.duration_sec || m.duration_sec <= 0) return "Duración de video inválida (0s o nula)";
  if (!video || video.length < 1000) return "Video base64 corrupto o demasiado pequeño";

  return null; // Todo ok
}

function generateSampleId() {
  const d = new Date();
  const datePart = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LSP-PER-${datePart}-${randomPart}`;
}

function updateMasterIndex(m) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheets()[0]; 
  
  const headers = [
    "sample_id", "participant_id", "session_id", "label_id", "label", 
    "repetition", "capture_datetime", "width", "height", "duration_sec",
    "device_type", "age", "region", "dominant_hand", "lsp_level", "participant_type",
    "consent_research", "consent_training", "consent_storage",
    "quality_status", "review_status", "processing_status",
    "video_url", "json_url"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  const row = headers.map(h => m[h] || "");
  sheet.appendRow(row);
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
