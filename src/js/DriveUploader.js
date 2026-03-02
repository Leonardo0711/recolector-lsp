export class DriveUploader {
    constructor() {
        this.gasUrl = import.meta.env.VITE_GAS_URL;
    }

    hasUrl() {
        return !!this.gasUrl;
    }

    /**
     * @param {Blob} videoBlob - The WebM video blob
     * @param {String} perfil - User profile string
     * @param {String} palabra - Word or sentence recorded
     * @param {String} tipo - "PALABRAS" or "ORACIONES"
     */
    async uploadData(videoBlob, perfil, palabra, tipo) {
        if (!this.hasUrl()) throw new Error("Google Apps Script URL no configurada.");

        // Convert the Video Blob to Base64 
        const base64Video = await this._blobToBase64(videoBlob);

        const payload = {
            perfil: perfil,
            palabra: palabra,
            tipo: tipo,
            videoBase64: base64Video
        };

        try {
            const response = await fetch(this.gasUrl, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });
            return { success: true };
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    }

    _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
