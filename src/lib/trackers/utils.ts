import {
    FaceLandmarker,
    HandLandmarker,
    PoseLandmarker,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

type FaceLandmarkerResult = any;
type HandLandmarkerResult = any;
type PoseLandmarkerResult = any;

export interface DetectionResults {
    face?: FaceLandmarkerResult;
    hand?: HandLandmarkerResult;
    pose?: PoseLandmarkerResult;
}

export function draw(canvasElement: HTMLCanvasElement, results: DetectionResults) {
    console.log(typeof results)

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
