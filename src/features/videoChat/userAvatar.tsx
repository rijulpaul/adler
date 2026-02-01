import { type RefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import * as THREE from "three";
import * as Kalidokit from "kalidokit";

import { trackFace, trackHand, trackPose } from "./utils/trackers";

function UserAvatar({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    const avatarMesh = nodes["Body"] as THREE.Mesh;
    const headBone = nodes["Head"] as THREE.Bone;

    const frameRef = useRef(0);

    useFrame(() => {
        if (!videoRef.current || !avatarMesh?.morphTargetInfluences || !avatarMesh.morphTargetDictionary) return;

        frameRef.current++;
        const cycle = frameRef.current % 3;

        switch (cycle) {
            case 0:
                updateFace(videoRef.current, avatarMesh, headBone);
                break;
            case 1:
                updatePose(videoRef.current);
                break;
            case 2:
                updateHand(videoRef.current);
                break;
        }

        // updateFace(videoRef.current, avatarMesh, headBone);
        // updatePose(videoRef.current);
        // updateHand(videoRef.current);
    });

    return (
        <>
            <primitive object={avatar} />
        </>
    )
}

export default UserAvatar;

function updateFace(videoElement: HTMLVideoElement, avatarMesh: THREE.Mesh, headBone: THREE.Bone) {
    const faceLandmarkerResult = trackFace(videoElement);

    if (faceLandmarkerResult?.faceBlendshapes?.length > 0) {
        const blendShapes = faceLandmarkerResult.faceBlendshapes[0].categories;
        blendShapes.forEach((blendShape: { categoryName: string; score: number }) => {
            const index = avatarMesh.morphTargetDictionary![blendShape.categoryName];
            if (index !== undefined) {
                avatarMesh.morphTargetInfluences![index] = blendShape.score;
            }
        });
    }

    if (faceLandmarkerResult?.faceLandmarks?.length > 0) {
        const faceRig = Kalidokit.Face.solve(faceLandmarkerResult.faceLandmarks[0], {
            runtime: "mediapipe",
            video: videoElement,
        });

        if (!faceRig) return;

        // rotate
        const r = faceRig.head.degrees;
        const euler = new THREE.Euler(
            -THREE.MathUtils.degToRad(r.x),
            -THREE.MathUtils.degToRad(r.y),
            THREE.MathUtils.degToRad(r.z),
            "XYZ"
        );
        const targetQ = new THREE.Quaternion().setFromEuler(euler);
        headBone.quaternion.slerp(targetQ, 0.2);
    }
}

function updatePose(videoElement: HTMLVideoElement) {
    const poseLandmarkerResult = trackPose(videoElement);
    if (poseLandmarkerResult?.worldLandmarks?.length > 0 && poseLandmarkerResult?.landmarks?.length > 0) {
        Kalidokit.Pose.solve(poseLandmarkerResult.worldLandmarks[0], poseLandmarkerResult.landmarks[0], {
            runtime: "mediapipe",
            video: videoElement,
            enableLegs: true,
        });
    }
}

function updateHand(videoElement: HTMLVideoElement) {
    trackHand(videoElement);
}
