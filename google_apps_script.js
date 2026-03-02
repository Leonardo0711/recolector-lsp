/**
 * RECOLECTOR DE LENGUAJE DE SEÑAS PERUANO
 * Backend Serverless para Google Drive
 * 
 * INSTRUCCIONES DE USO:
 * 1. Ve a https://script.google.com/ e inicia sesión con tu cuenta de Google.
 * 2. Clic en "Nuevo Proyecto".
 * 3. Copia TODO este código y pégalo en el editor (borrando la función predeterminada).
 * 4. Modifica la variable FOLDER_ID_BASE con el ID de la carpeta en tu Drive donde quieras guardar todo.
 *    (El ID es el código largo en la URL de tu carpeta de Drive, ej: https://drive.google.com/drive/folders/1aBcD2eFgH3iJkL...)
 * 5. Clic en "Guardar" (icono de disquete).
 * 6. Clic en "Implementar" -> "Nueva implementación" (arriba a la derecha).
 * 7. Selecciona el tipo de engranaje ⚙️ -> "Aplicación Web".
 *    - Descripción: "API Recolector LSP"
 *    - Ejecutar como: "Yo (tu correo)"
 *    - Quién tiene acceso: "Cualquier persona" (IMPORTANTE para que la web funcione sin pedir login a tus usuarios).
 * 8. Clic en "Implementar".
 * 9. Autoriza los accesos cuando te lo pida (Avanzado -> Ir a Proyecto (Inseguro) -> Permitir).
 * 10. Copia la "URL de la aplicación web".
 * 11. Esa URL es la que pegarás en el archivo JavaScript de nuestro proyecto Frontend.
 */

// ¡CAMBIA ESTO POR EL ID DE TU CARPETA RAIZ EN DRIVE Y PEGA EL ARCHIVO EN APP SCRIPT!
const FOLDER_ID_BASE = "TU_ID_DE_CARPETA_AQUI";

function doPost(e) {
  try {
    // Evitar errores por requests vacíos (CORS preflight)
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Recibir los datos del Frontend
    const data = JSON.parse(e.postData.contents);
    const perfil = data.perfil || "Desconocido";
    const palabra = data.palabra || "Varios";
    const tipo = data.tipo || "PALABRAS"; // "PALABRAS" o "ORACIONES"

    // Archivos en Base64
    const videoData = data.videoBase64;
    const filenameBase = `${perfil}_${palabra}_${Date.now()}`;

    // 2. Localizar la carpeta base ("Base de Datos")
    const baseFolder = DriveApp.getFolderById(FOLDER_ID_BASE);

    // 3. Crear o encontrar la carpeta del Perfil (Usuario)
    let perfilFolder = getOrCreateSubFolder(baseFolder, perfil);

    // 4. Crear o encontrar la carpeta del Tipo (PALABRAS / ORACIONES)
    let tipoFolder = getOrCreateSubFolder(perfilFolder, tipo);

    // 5. Crear o encontrar la carpeta de la Palabra/Oración
    let palabraFolder = getOrCreateSubFolder(tipoFolder, palabra);

    // 6. Decodificar el video WebM (viene como: data:video/webm;base64,.....)
    const base64Video = videoData.split(',')[1];
    const decodedVideo = Utilities.base64Decode(base64Video);
    const videoBlob = Utilities.newBlob(decodedVideo, 'video/webm', `${filenameBase}.webm`);
    palabraFolder.createFile(videoBlob);

    // 6. JSON Removido (Solo video HD en esta arquitectura)

    // 7. Responder "Éxito" a la web
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Archivos guardados en Drive" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Responder con cualquier error
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función auxiliar para buscar carpetas por nombre, o crearlas si no existen
function getOrCreateSubFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next(); // Ya existe, la devuelve
  } else {
    return parentFolder.createFolder(folderName); // No existe, la crea y la devuelve
  }
}

// CORS Helper para que la web pueda hacer requests (OPTIONS preflight)
function doOptions(e) {
  return ContentService.createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}
