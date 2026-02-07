import * as kalidokit from "kalidokit";

class KalidokitService {
    private videoElement: HTMLVideoElement | null;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
    }

    solveFace(faceLandmarks: []) {
        return kalidokit.Face.solve(faceLandmarks[0], {
            runtime: "mediapipe",
            video: this.videoElement,
        });
    }

    solvePose(poseLandmarks: []) {
        return kalidokit.Pose.solve(poseLandmarks[0], {
            runtime: "mediapipe",
            video: this.videoElement,
        });
    }

    solveHands(handLandmarks: []) {
        type HandRig = {
            Left?: kalidokit.THand<kalidokit.Side> | undefined;
            Right?: kalidokit.THand<kalidokit.Side> | undefined;
        };
        const handRig: HandRig = {};

        // Just solving for now
        const { landmarks, handednesses } = handLandmarks;
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const side: kalidokit.Side = handednesses?.[0]?.[i]?.categoryName;
            const solved = kalidokit.Hand.solve(lm, side);
            if (solved) {
                handRig[side] = solved;
            }
        }

        return handRig;
    }
}

export default KalidokitService;