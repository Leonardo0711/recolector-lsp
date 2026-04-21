export class CameraManager {
    constructor(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.stream = null;
    }

    async startCamera() {
        try {
            // Pedir alta resolución y prioridad a la cámara frontal (o la web si existe)
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode: "user"
                },
                audio: false
            });

            this.videoElement.srcObject = this.stream;

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
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
    }

    getStream() {
        return this.stream;
    }
}
