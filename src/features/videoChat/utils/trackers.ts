import {
    FaceLandmarker,
    HandLandmarker,
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
);

export const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
    modelComplexity: 0,
});

export const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
    modelComplexity: 1,
});

export const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    modelComplexity: 1,
    enableSegmentation: false,
});

export function trackFace(videoElement: HTMLVideoElement) {
    if (!faceLandmarker) return;

    if (
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0
    ) {
        return;
    }

    const startTimeMs = performance.now();
    return faceLandmarker.detectForVideo(videoElement, startTimeMs);
}

export function trackHand(videoElement: HTMLVideoElement) {
    if (!handLandmarker) return;
    if (
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0
    ) {
        return;
    }

    const startTimeMs = performance.now();
    return handLandmarker.detectForVideo(videoElement, startTimeMs);
}

export function trackPose(videoElement: HTMLVideoElement) {
    if (!poseLandmarker) return;
    if (
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0
    ) {
        return;
    }

    const startTimeMs = performance.now();
    return poseLandmarker.detectForVideo(videoElement, startTimeMs);
}

export interface DetectionResults {
    face?: object;
    hand?: object;
    pose?: object;
}

export function draw(canvasElement: HTMLCanvasElement, results: DetectionResults) {
    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    const drawingUtils = new DrawingUtils(canvasCtx);

    if (results.face && results.face.faceLandmarks) {
        for (const landmarks of results.face.faceLandmarks) {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030", lineWidth: 2 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30", lineWidth: 2 });
        }
    }

    if (results.hand && results.hand.landmarks) {
        for (const landmarks of results.hand.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
            drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });
        }
    }

    if (results.pose && results.pose.landmarks) {
        for (const landmark of results.pose.landmarks) {
            drawingUtils.drawLandmarks(landmark, {
                radius: (data: { from?: NormalizedLandmark }) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
            });
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
        }
    }
}
