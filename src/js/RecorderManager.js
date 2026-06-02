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

        // Priorizar códecs que suelen tener aceleración por hardware en móviles (H.264/AVC)
        let options = {};
        const candidates = [
            'video/webm;codecs=h264',
            'video/mp4;codecs=avc1',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        let selectedMimeType = '';
        for (const mime of candidates) {
            if (MediaRecorder.isTypeSupported(mime)) {
                selectedMimeType = mime;
                break;
            }
        }

        if (selectedMimeType) {
            options.mimeType = selectedMimeType;
            console.log("MIME Type seleccionado para grabación:", selectedMimeType);
        } else {
            console.warn("Ninguno de los MIME types preferidos está soportado. Usando valor por defecto.");
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
                const currentMimeType = this.mediaRecorder.mimeType || 'video/webm';
                this.videoBlob = new Blob(this.recordedChunks, { type: currentMimeType });

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
