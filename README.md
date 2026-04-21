# Recolector de Lenguaje de Señas Peruano (LSP) - Grado Científico

Este proyecto es una plataforma web profesional diseñada para recolectar un dataset estandarizado de **Lenguaje de Señas Peruano (LSP)**. A diferencia de recolectores genéricos, este sistema aplica rigurosidad científica en la captura de metadatos, gestión ética y consistencia léxica.

## Características Principales

*   **Vocabulario Estructurado**: Lista cerrada de 50 palabras clave categorizadas para garantizar un dataset balanceado y útil para modelos de clasificación.
*   **Gestión Ética**: Flujo de consentimiento informado obligatorio integrado en la sesión de recolección.
*   **Metadatos de Alta Fidelidad**: Captura automática de resolución, duración, mano dominante, región y tipo de dispositivo.
*   **Validación Humana**: Fase de revisión post-captura para asegurar la calidad del video antes de la subida.
*   **Validación Robusta**: El servidor valida la integridad de cada muestra, asegurando que existan consentimientos y metadatos completos antes de procesar el video.
*   **Persistencia de Progreso**: El sistema recuerda el perfil del participante y su avance en las repeticiones de cada palabra de forma local, permitiendo sesiones de recolección intermitentes sin pérdida de datos.
*   **Infraestructura Serverless**: Integración directa con Google Drive y Google Sheets (Índice Maestro) para una organización inmediata de los datos RAW.

## Estructura del Dataset (Drive)

El sistema organiza los archivos siguiendo una jerarquía lógica para facilitar el procesamiento posterior:
*   `raw/videos/YYYY/MM/`: Archivos de video `.webm` crudos.
*   `raw/metadata/YYYY/MM/`: Archivos `.json` con los metadatos técnicos y demográficos vinculados.
*   **Índice Maestro**: Google Sheet centralizado que actúa como base de datos de consulta rápida de todo el corpus.

## Requerimientos Técnicos

*   **Cámara**: Captura ideal en 720p (1280x720) para balancear detalle y peso de archivo.
*   **Navegador**: Soporte moderno para `MediaRecorder` API y `Base64` encoding.
*   **Backend**: Google Apps Script (GAS) configurado como Web App.

---
*Desarrollado para fines de investigación académica en IA aplicada a la inclusión.*
