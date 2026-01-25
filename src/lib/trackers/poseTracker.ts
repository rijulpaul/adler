import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
);

// initialize pose landmarker
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
    delegate: "GPU"
  },
  runningMode: 'VIDEO',
  numPoses: 1,
  modelComplexity: 1,
  enableSegmentation: false,
});

export function detectPose(videoElement: HTMLVideoElement) {
  if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return;
  }

  const startTimeMs = performance.now();
  return poseLandmarker.detectForVideo(videoElement, startTimeMs);
}
