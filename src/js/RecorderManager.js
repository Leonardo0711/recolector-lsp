export class RecorderManager {
    constructor(videoStream) {
        this.stream = videoStream;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.videoBlob = null;
    }

    startRecording() {
        this.recordedChunks = [];
        this.videoBlob = null;

        // Try getting WebM with codecs if possible
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm' };
            }
        }

        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        // Start video recording
        this.mediaRecorder.start();
        console.log("Grabación Iniciada.");
    }

    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                // Get Video Blob
                this.videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });

                console.log("Grabación Detenida.");
                resolve({
                    videoBlob: this.videoBlob
                });
            };

            this.mediaRecorder.stop();
        });
    }
}
