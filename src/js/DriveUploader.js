export class DriveUploader {
    constructor() {
        this.gasUrl = import.meta.env.VITE_GAS_URL;
    }

    hasUrl() {
        return !!this.gasUrl;
    }

    /**
     * @param {Blob} videoBlob - The WebM video blob
     * @param {Object} metadata - The full sample metadata
     */
    async uploadData(videoBlob, metadata) {
        if (!this.hasUrl()) throw new Error("Google Apps Script URL no configurada.");

        // Convert the Video Blob to Base64 
        const base64Video = await this._blobToBase64(videoBlob);

        const payload = {
            metadata: metadata,
            videoBase64: base64Video
        };

        try {
            const response = await fetch(this.gasUrl, {
                method: "POST",
                mode: "cors", // Changed to cors to get response
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Servidor respondió con status: ${response.status}`);
            }

            const result = await response.json();
            if (result.status === "error") {
                throw new Error(result.message);
            }

            return result;
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
