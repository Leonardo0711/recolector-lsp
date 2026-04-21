export class RecorderManager {
    constructor(videoStream) {
        this.stream = videoStream;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.videoBlob = null;
        this.startTime = 0;
        this.duration = 0;
    }

    startRecording() {
        this.recordedChunks = [];
        this.videoBlob = null;
        this.startTime = performance.now();

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
                this.duration = (performance.now() - this.startTime) / 1000;
                this.videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });

                // Get resolution from stream
                const track = this.stream.getVideoTracks()[0];
                const settings = track.getSettings();

                console.log("Grabación Detenida.");
                resolve({
                    videoBlob: this.videoBlob,
                    width: settings.width || 0,
                    height: settings.height || 0,
                    duration: this.duration
                });
            };

            this.mediaRecorder.stop();
        });
    }
}
