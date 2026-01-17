import {
    HandLandmarker,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
);
const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
    },
    runningMode: 'VIDEO',
    numHands: 2,
    modelComplexity: 0
});

let lastVideoTime = -1;
let results = undefined;

function handTracker(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        // Video not ready yet
        return;
    }

    const canvasCtx = canvasElement.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);

    const startTimeMs = performance.now();
    if (lastVideoTime !== videoElement.currentTime) {
        lastVideoTime = videoElement.currentTime;
        results = handLandmarker.detectForVideo(videoElement, startTimeMs);
    }

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
        }
    }
}

export default handTracker;