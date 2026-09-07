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
            action: "uploadSample",
            metadata: metadata,
            videoBase64: base64Video
        };

        return this._post(payload);
    }

    async checkParticipantEmail(email) {
        return this._post({ action: "checkParticipantEmail", email });
    }

    async completeFirstTimeRegistration(email, tempCode, password, profile) {
        return this._post({
            action: "completeFirstTimeRegistration",
            email: email,
            temp_code: tempCode,
            password: password,
            profile: profile
        });
    }

    async loginParticipant(email, password) {
        return this._post({
            action: "loginParticipant",
            email: email,
            password: password
        });
    }

    async registerParticipant(participant) {
        return this._post({ action: "registerParticipant", participant });
    }

    async resumeParticipant(participantId, resumeCode) {
        return this._post({
            action: "getParticipantProgress",
            participant_id: participantId,
            resume_code: resumeCode
        });
    }

    async adminResetParticipantPassword(targetEmail, targetParticipantId = "") {
        return this._post({
            action: "adminResetParticipantPassword",
            target_email: targetEmail,
            target_participant_id: targetParticipantId
        });
    }

    async _post(payload) {
        if (!this.hasUrl()) throw new Error("Google Apps Script URL no configurada.");
        try {
            const response = await fetch(this.gasUrl, {
                method: "POST",
                mode: "cors", // Changed to cors to get response
                headers: {
                    "Content-Type": "text/plain",
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Servidor respondió con status: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error.message || "Error interno de Google Apps Script");
            }
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
