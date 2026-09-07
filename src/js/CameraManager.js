export class CameraManager {
    static activeStreams = new Set();
    static activeTracks = new Set();

    /**
     * Apaga y libera todas las pistas de hardware de video/audio activas en toda la página.
     */
    static stopAllMediaTracks() {
        try {
            // 1. Detener pistas registradas individualmente
            CameraManager.activeTracks.forEach(track => {
                try {
                    track.enabled = false;
                    track.stop();
                } catch (e) {}
            });
            CameraManager.activeTracks.clear();

            // 2. Detener pistas de flujos registrados
            CameraManager.activeStreams.forEach(stream => {
                try {
                    if (stream && typeof stream.getTracks === 'function') {
                        stream.getTracks().forEach(t => {
                            try {
                                t.enabled = false;
                                t.stop();
                            } catch (e) {}
                        });
                    }
                } catch (e) {}
            });
            CameraManager.activeStreams.clear();

            // 3. Inspeccionar y reiniciar todos los elementos <video> del DOM
            document.querySelectorAll('video').forEach(video => {
                try {
                    if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
                        video.srcObject.getTracks().forEach(t => {
                            try {
                                t.enabled = false;
                                t.stop();
                            } catch (e) {}
                        });
                    }
                    video.pause();
                    video.srcObject = null;
                    video.removeAttribute('src');
                    try { video.load(); } catch (e) {}
                } catch (e) {}
            });
        } catch (err) {
            console.warn("Error en stopAllMediaTracks:", err);
        }
    }

    constructor(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.stream = null;
        this.facingMode = "user"; // Default to front camera
    }

    async startCamera() {
        try {
            // Asegurar que cualquier pista anterior esté completamente apagada
            this.stopCamera();

            // Pedir alta resolución y prioridad a la cámara seleccionada
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, max: 30 }, // Evitar 60fps para optimizar rendimiento y CPU en móviles
                    facingMode: this.facingMode
                },
                audio: false
            });

            // Registrar flujo y pistas activas para su cierre forzoso
            CameraManager.activeStreams.add(this.stream);
            this.stream.getTracks().forEach(track => {
                CameraManager.activeTracks.add(track);
                track.addEventListener('ended', () => {
                    CameraManager.activeTracks.delete(track);
                });
            });

            this.videoElement.srcObject = this.stream;

            // Aplicar espejo únicamente para la cámara frontal (user)
            if (this.facingMode === "user") {
                this.videoElement.style.transform = "scaleX(-1)";
            } else {
                this.videoElement.style.transform = "scaleX(1)";
            }

            // Retorna una promesa que se resuelve cuando el video tiene metadata (ancho/alto)
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve({
                        width: this.videoElement.videoWidth,
                        height: this.videoElement.videoHeight
                    });
                };
            });
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);
            throw new Error("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    }

    stopCamera() {
        if (this.stream) {
            try {
                this.stream.getTracks().forEach(track => {
                    try {
                        track.enabled = false;
                        track.stop();
                    } catch (e) {
                        console.warn("Error deteniendo pista de cámara:", e);
                    }
                    CameraManager.activeTracks.delete(track);
                });
            } catch (e) {}
            CameraManager.activeStreams.delete(this.stream);
            this.stream = null;
        }

        if (this.videoElement) {
            try {
                if (this.videoElement.srcObject && typeof this.videoElement.srcObject.getTracks === 'function') {
                    this.videoElement.srcObject.getTracks().forEach(track => {
                        try {
                            track.enabled = false;
                            track.stop();
                        } catch (e) {}
                        CameraManager.activeTracks.delete(track);
                    });
                }
                this.videoElement.pause();
                this.videoElement.srcObject = null;
                this.videoElement.removeAttribute('src');
                try { this.videoElement.load(); } catch (e) {}
            } catch (e) {}
        }

        CameraManager.stopAllMediaTracks();
    }

    async switchCamera() {
        this.facingMode = this.facingMode === "user" ? "environment" : "user";
        this.stopCamera();
        return this.startCamera();
    }

    getStream() {
        return this.stream;
    }
}
