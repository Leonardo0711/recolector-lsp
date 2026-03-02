export class DriveUploader {
    constructor() {
        this.gasUrl = import.meta.env.VITE_GAS_URL;
    }

    hasUrl() {
        return true;
    }

    setUrl(url) {
        // Obsoleto
    }

    /**
     * @param {Blob} videoBlob - The WebM video blob
     * @param {String} perfil - User profile string
     * @param {String} palabra - Word recorded
     */
    async uploadData(videoBlob, perfil, palabra) {
        if (!this.hasUrl()) throw new Error("Google Apps Script URL no configurada.");

        // Convert the Video Blob out of memory to Base64 
        const base64Video = await this._blobToBase64(videoBlob);

        const payload = {
            perfil: perfil,
            palabra: palabra,
            videoBase64: base64Video
        };

        try {
            const response = await fetch(this.gasUrl, {
                method: "POST",
                mode: "no-cors", // Required to bypass CORS to a Google webapp in an opaque way
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });
            // Opaque responses do not have ok/status readable. If it didn't throw network error, we assume GAS processed it.
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
