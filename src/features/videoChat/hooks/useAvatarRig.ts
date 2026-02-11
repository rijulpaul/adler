import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as Kalidokit from "kalidokit";
import { mediaPipeService } from "../services/mediapipe";
// import { RotationSmoother } from "../utils/math";
import * as boneMap from "/public/avatars/AnimeGirlKawaii/AnimeGirlKawaii_BoneMap.json";
import calculateArmAngles from "../utils/armAngles";

interface AvatarRigProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    nodes: Record<string, THREE.Object3D>;
    isReady: boolean;
}

export function useAvatarRig({ videoRef, nodes, isReady }: AvatarRigProps) {
    const frameRef = useRef(0);

    // Pose rest quaternions (CRITICAL)
    const poseRest = useRef<Record<string, THREE.Quaternion>>({});

    // Smoothers
    // const headSmoother = useRef(new RotationSmoother(0.15));

    useEffect(() => {
        mediaPipeService.initialize();
    }, []);

    // Cache pose rest rotations ONCE
    useEffect(() => {
        if (!isReady) return;

        for (const bone in boneMap.Pose) {
            const modelBone = nodes[boneMap.Pose[bone]];
            if (modelBone) {
                poseRest.current[bone] = modelBone.quaternion.clone();
            }
        }
    }, [isReady, nodes]);

    useFrame(() => {
        const video = videoRef.current;
        if (!isReady || !video) return;

        frameRef.current++;
        const cycle = frameRef.current % 2;

        // =========================
        // FACE
        // =========================
        if (cycle === 0) {
            const faceResult = mediaPipeService.trackFace(video);
            if (!faceResult?.faceLandmarks?.length) return;

            const faceRig = Kalidokit.Face.solve(faceResult.faceLandmarks[0], {
                runtime: "mediapipe",
                video,
            });

            if (!faceRig) return;

            const headBone = nodes[boneMap.Face.head] as THREE.Bone;
            if (!headBone) return;

            const r = faceRig.head.degrees;
            const euler = new THREE.Euler(
                -THREE.MathUtils.degToRad(r.x + 10),
                -THREE.MathUtils.degToRad(r.y),
                THREE.MathUtils.degToRad(r.z),
                "XYZ"
            );

            const targetQ = new THREE.Quaternion().setFromEuler(euler);
            // headBone.quaternion.copy(headSmoother.current.smooth(targetQ));
            headBone.quaternion.slerp(targetQ, 0.4);
        }

        // =========================
        // POSE (FIXED)
        // =========================
        if (cycle === 1) {
            const poseResult = mediaPipeService.trackPose(video);

            if (!poseResult?.worldLandmarks?.length) return;

            const poseRig = Kalidokit.Pose.solve(
                poseResult.worldLandmarks[0],
                poseResult.landmarks[0],
                { runtime: "mediapipe", video, enableLegs: false }
            );

            for (const bone in poseRig) {
                if (!boneMap.Pose[bone]) continue;
                if (bone === "Hips" || bone.endsWith("Arm")) continue;

                const boneNode = nodes[boneMap.Pose[bone]];
                const restQ = poseRest.current[bone];
                if (!boneNode || !restQ) continue;

                const r = poseRig[bone];

                // DO NOT swap axes
                const euler = new THREE.Euler(
                    -r.x,
                    -r.y,
                    r.z,
                    "XYZ"
                );

                const deltaQ = new THREE.Quaternion().setFromEuler(euler);
                const finalQ = restQ.clone().multiply(deltaQ);

                boneNode.quaternion.slerp(finalQ, 0.3);
            }

            const armRotations = calculateArmAngles(poseResult.worldLandmarks[0]);
            for (const bone in armRotations) {
                const boneNode = nodes[boneMap.Pose[bone]];
                // const restQ = poseRest.current[bone];
                if (!boneNode) continue;

                const r = armRotations[bone];

                const euler = new THREE.Euler(
                    THREE.MathUtils.degToRad(r.x),
                    THREE.MathUtils.degToRad(r.y),
                    THREE.MathUtils.degToRad(r.z),
                    "XYZ"
                );

                const finalQ = new THREE.Quaternion().setFromEuler(euler);

                boneNode.quaternion.slerp(finalQ, 0.3);
            }
        }

        // =========================
        // HAND
        // =========================
        if (cycle === 2) {
            const handResult = mediaPipeService.trackHand(video);
            if (!handResult?.landmarks?.length) return;

            const { landmarks, handednesses } = handResult;

            for (let i = 0; i < landmarks.length; i++) {
                const side = handednesses?.[i]?.[0]?.categoryName === "Left" ? "Right" : "Left";
                const solved = Kalidokit.Hand.solve(landmarks[i], side);
                if (!solved) continue;

                const isRight = side === "Right";

                for (const bone in solved) {
                    const boneName = boneMap.Hand?.[side]?.[bone];
                    if (!boneName) continue;

                    const handBone = nodes[boneName] as THREE.Bone;
                    if (!handBone) continue;

                    const r = solved[bone];

                    const euler = new THREE.Euler(
                        isRight ? -r.z : r.z,
                        r.y,
                        -r.x,
                        "XYZ"
                    );

                    const q = new THREE.Quaternion().setFromEuler(euler);
                    handBone.quaternion.slerp(q, 0.2);
                }
            }
        }
    });
}
