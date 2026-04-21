# Recolector de Lenguaje de Señas Peruano (LSP) - Grado Científico

Este proyecto es una plataforma web profesional diseñada para recolectar un dataset estandarizado de **Lenguaje de Señas Peruano (LSP)**. A diferencia de recolectores genéricos, este sistema aplica rigurosidad científica en la captura de metadatos, gestión ética y consistencia léxica.

## Características Principales

*   **Vocabulario Multi-Bloque**: Más de 200 ítems lingüísticos divididos en 4 bloques (Léxico Aislado, Expresiones Fijas, Secuencias Controladas y Signing Continuo).
*   **Gestión Ética Rigurosa**: Flujo de consentimiento informado obligatorio con validación tanto en el frontend como en el backend.
*   **Metadatos de Alta Fidelidad**: Captura automática de resolución, duración, mano dominante, región y tipo de dispositivo, vinculados por modo de captura.
*   **Validación de Calidad**: Fase de revisión post-captura con opción de marcar muestras incompletas para auditoría.
*   **Infraestructura Escalable**: Integración directa con Google Drive y Google Sheets (Índice Maestro) con organización jerárquica automática.

## Estructura del Dataset (Drive)

El sistema organiza los archivos siguiendo una jerarquía científica para facilitar el entrenamiento de modelos:
*   `raw/{capture_mode}/videos/YYYY/MM/`: Archivos de video `.webm`.
*   `raw/{capture_mode}/metadata/YYYY/MM/`: Archivos `.json` con metadatos técnicos y demográficos.
*   **Índice Maestro**: Google Sheet con pestañas separadas para `samples` (muestras) y `participants` (perfiles).

## Requerimientos Técnicos

*   **Cámara**: Captura ideal en 720p (1280x720) para balancear detalle y peso de archivo.
*   **Navegador**: Soporte moderno para `MediaRecorder` API y `Base64` encoding.
*   **Backend**: Google Apps Script (GAS) configurado como Web App.

---
*Desarrollado para fines de investigación académica en IA aplicada a la inclusión.*
