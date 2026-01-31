import { useFrame } from "@react-three/fiber";
import { type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as Kalidokit from "kalidokit";

import { detectFace } from "../../lib/trackers/faceTracker";
// import { detectHand } from "../../lib/trackers/handTracker";
// import { detectPose } from "../../lib/trackers/poseTracker";

function UserAvatar({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    const avatarMesh = nodes["Body"] as THREE.Mesh;
    const headBone = nodes["Head"] as THREE.Bone;

    useFrame(() => {
        if (!videoRef.current || !avatarMesh?.morphTargetInfluences || !avatarMesh.morphTargetDictionary) return;

        const faceLandmarkerResult = detectFace(videoRef.current);

        if (faceLandmarkerResult && faceLandmarkerResult.faceBlendshapes && faceLandmarkerResult.faceBlendshapes.length > 0) {
            const blendShapes = faceLandmarkerResult.faceBlendshapes[0].categories;

            blendShapes.forEach((blendShape: { categoryName: string; score: number }) => {
                const index = avatarMesh.morphTargetDictionary![blendShape.categoryName];
                if (index !== undefined) {
                    avatarMesh.morphTargetInfluences![index] = blendShape.score;
                }
            });
        }

        if (faceLandmarkerResult && faceLandmarkerResult.faceBlendshapes && faceLandmarkerResult.faceBlendshapes.length > 0) {
            const rig = Kalidokit.Face.solve(faceLandmarkerResult.faceLandmarks[0], {
                runtime: "mediapipe",
                video: videoRef.current,
            });

            if (!rig || !avatarMesh) return;

            // rotate
            const r = rig.head.degrees;
            const euler = new THREE.Euler(
                -THREE.MathUtils.degToRad(r.x),
                -THREE.MathUtils.degToRad(r.y),
                THREE.MathUtils.degToRad(r.z),
                "XYZ"
            );
            const targetQ = new THREE.Quaternion().setFromEuler(euler);
            headBone.quaternion.slerp(targetQ, 0.2);

            // position
            // const p = rig.head.position;
            // headBone.position.set(p.x * 0.0001 - 0.01, p.y * 0.0001, p.z * 0.0001);
        }
    });

    return (
        <>
            <primitive object={avatar} />
        </>
    )
}

export default UserAvatar;
