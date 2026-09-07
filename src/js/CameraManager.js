export class CameraManager {
    constructor(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.stream = null;
        this.facingMode = "user"; // Default to front camera
    }

    async startCamera() {
        try {
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
            this.stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn("Error deteniendo pista de cámara:", e);
                }
            });
            this.stream = null;
        }
        if (this.videoElement) {
            try {
                this.videoElement.pause();
                this.videoElement.srcObject = null;
            } catch (e) {}
        }
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
