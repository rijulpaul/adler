import { useFrame } from "@react-three/fiber";
import { type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { detectFace } from "../../lib/trackers/faceTracker";
// import { detectHand } from "../../lib/trackers/handTracker";
// import { detectPose } from "../../lib/trackers/poseTracker";

function UserAvatar({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    const faceMesh = nodes["Body"] as THREE.Mesh;

    useFrame(() => {
        if (!videoRef.current || !faceMesh?.morphTargetInfluences || !faceMesh.morphTargetDictionary) return;

        const faceLandmarkerResult = detectFace(videoRef.current);

        if (faceLandmarkerResult && faceLandmarkerResult.faceBlendshapes && faceLandmarkerResult.faceBlendshapes.length > 0) {
            const blendShapes = faceLandmarkerResult.faceBlendshapes[0].categories;

            blendShapes.forEach((blendShape: { categoryName: string; score: number }) => {
                const index = faceMesh.morphTargetDictionary![blendShape.categoryName];
                if (index !== undefined) {
                    faceMesh.morphTargetInfluences![index] = blendShape.score;
                }
            });
        }
    });

    // const blinkIndex =
    //     faceMesh.morphTargetDictionary["Blink R"];

    // if (blinkIndex === undefined) {
    //     console.error("Blink_R not found");
    // }
    // let t = 0;

    // useFrame((_, delta) => {
    //     t += delta * 2; // speed
    //     faceMesh.morphTargetInfluences[blinkIndex] =
    //         Math.abs(Math.sin(t));
    // });

    // const bones = useMemo(() => {
    //     const result = {}
    //     avatar.traverse((obj) => {
    //         if (obj.isSkinnedMesh) {
    //             obj.skeleton.bones.forEach((bone) => {
    //                 result[bone.name] = bone
    //             })
    //         }
    //     })
    //     return result
    // }, [avatar])

    // console.log(bones)

    // const rot = 0.05;
    // useFrame(() => {
    //     if (bones.handL) {
    //         // bones.shoulderL.rotation.z = (Math.sin(rot) * 0.4);
    //         bones.handL.rotation.x += rot * 0.2;
    //         bones.upper_armL.rotation.z += rot;

    //         // rot += 0.05;
    //     }
    // })

    return (
        <>
            <primitive object={avatar} />
        </>
    )
}

export default UserAvatar;
