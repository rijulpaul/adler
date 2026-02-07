import {
    FaceLandmarker,
    HandLandmarker,
    PoseLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

export interface DetectionResults {
    face?: object; // Using exact types if available would be better, but avoiding strict typing issues for now
    hand?: object;
    pose?: object;
}

class MediaPipeService {
    private faceLandmarker: FaceLandmarker | null = null;
    private handLandmarker: HandLandmarker | null = null;
    private poseLandmarker: PoseLandmarker | null = null;
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        const [face, hand, pose] = await Promise.all([
            FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU",
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1,
                modelComplexity: 2,
            }),
            HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numHands: 2,
                modelComplexity: 2,
            }),
            PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numPoses: 1,
                modelComplexity: 2,
                enableSegmentation: false,
            })
        ]);

        this.faceLandmarker = face;
        this.handLandmarker = hand;
        this.poseLandmarker = pose;
        this.initialized = true;
    }

    trackFace(videoElement: HTMLVideoElement) {
        if (!this.faceLandmarker || !this.canTrack(videoElement)) return null;
        return this.faceLandmarker.detectForVideo(videoElement, performance.now());
    }

    trackHand(videoElement: HTMLVideoElement) {
        if (!this.handLandmarker || !this.canTrack(videoElement)) return null;
        return this.handLandmarker.detectForVideo(videoElement, performance.now());
    }

    trackPose(videoElement: HTMLVideoElement) {
        if (!this.poseLandmarker || !this.canTrack(videoElement)) return null;
        return this.poseLandmarker.detectForVideo(videoElement, performance.now());
    }

    private canTrack(video: HTMLVideoElement) {
        return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
    }
}

export const mediaPipeService = new MediaPipeService();
