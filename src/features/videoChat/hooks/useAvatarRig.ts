import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as Kalidokit from "kalidokit";
import { mediaPipeService } from "../services/mediapipe";
import { RotationSmoother } from "../utils/math";

// Define types for the rig parts
interface AvatarRigProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    avatarMesh: THREE.Mesh | undefined;
    headBone: THREE.Bone | undefined;
    isReady: boolean;
}

export function useAvatarRig({ videoRef, avatarMesh, headBone, isReady }: AvatarRigProps) {
    const frameRef = useRef(0);
    const smoother = useRef(new RotationSmoother(0.15));

    // Initialize MediaPipe service
    useEffect(() => {
        mediaPipeService.initialize();
    }, []);

    useFrame(() => {
        const videoElement = videoRef.current;
        if (!isReady || !videoElement || !avatarMesh?.morphTargetInfluences || !avatarMesh.morphTargetDictionary || !headBone) {
            return;
        }

        frameRef.current++;
        // Distribute processing across frames to maintain basic 30-60fps performance without overloading
        const cycle = frameRef.current % 3;

        switch (cycle) {
            case 0:
                updateFace(videoElement, avatarMesh, headBone, smoother.current);
                break;
            case 1:
                updatePose(videoElement);
                break;
            case 2:
                updateHand(videoElement);
                break;
        }
    });
}

function updateFace(
    videoElement: HTMLVideoElement,
    avatarMesh: THREE.Mesh,
    headBone: THREE.Bone,
    smoother: RotationSmoother
) {
    const faceResult = mediaPipeService.trackFace(videoElement);

    if (faceResult?.faceBlendshapes?.length > 0) {
        const blendShapes = faceResult.faceBlendshapes[0].categories;
        blendShapes.forEach((blendShape: { categoryName: string; score: number }) => {
            const index = avatarMesh.morphTargetDictionary![blendShape.categoryName];
            if (index !== undefined) {
                avatarMesh.morphTargetInfluences![index] = blendShape.score;
            }
        });
    }

    if (faceResult?.faceLandmarks?.length > 0) {
        const faceRig = Kalidokit.Face.solve(faceResult.faceLandmarks[0], {
            runtime: "mediapipe",
            video: videoElement,
        });

        if (faceRig) {
            const r = faceRig.head.degrees;
            const euler = new THREE.Euler(
                -THREE.MathUtils.degToRad(r.x),
                -THREE.MathUtils.degToRad(r.y),
                THREE.MathUtils.degToRad(r.z),
                "XYZ"
            );
            const targetQ = new THREE.Quaternion().setFromEuler(euler);

            // Apply smoothing
            const smoothedQ = smoother.smooth(targetQ);
            headBone.quaternion.copy(smoothedQ);
        }
    }
}

function updatePose(videoElement: HTMLVideoElement) {
    const poseResult = mediaPipeService.trackPose(videoElement);
    if (poseResult?.worldLandmarks?.length > 0 && poseResult?.landmarks?.length > 0) {
        // Just solving for now, can apply to bones if we had a full body rig
        const poseRig = Kalidokit.Pose.solve(poseResult.worldLandmarks[0], poseResult.landmarks[0], {
            runtime: "mediapipe",
            video: videoElement,
            enableLegs: true,
        });
        console.log(poseRig);
    }
}

function updateHand(videoElement: HTMLVideoElement) {
    const handResult = mediaPipeService.trackHand(videoElement);
    if (!handResult?.landmarks?.length) return;
    const handRig: HandRig = {}
    type HandRig = {
        Left?: Kalidokit.THand<Kalidokit.Side> | undefined;
        Right?: Kalidokit.THand<Kalidokit.Side> | undefined;
    }
    // Just solving for now
    const { landmarks, handednesses } = handResult;
    for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        const side: Kalidokit.Side = handednesses?.[0]?.[i]?.categoryName === "Left" ? "Left" : "Right";
        const solved = Kalidokit.Hand.solve(lm, side);
        if (solved) {
            handRig[side] = solved;
        }
    }
    console.log(handRig);
}
