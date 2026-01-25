import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver } = vision;

const filesetResolver = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
);

// initalize the faceLandmarker
const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
    delegate: "GPU",
  },
  outputFaceBlendshapes: true,
  runningMode: 'VIDEO',
  numFaces: 1,
});

// detect face
export function detectFace(videoElement: HTMLVideoElement) {
  if (!faceLandmarker) return;

  if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return;
  }

  const startTimeMs = performance.now();
  return faceLandmarker.detectForVideo(videoElement, startTimeMs);
}
