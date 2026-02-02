import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useAvatarRig } from "../hooks/useAvatarRig";

interface UserAvatarProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraReady: boolean;
}

function UserAvatar({ videoRef, isCameraReady }: UserAvatarProps) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    const avatarMesh = nodes["Body"] as THREE.Mesh;
    const headBone = nodes["Head"] as THREE.Bone;

    useAvatarRig({
        videoRef,
        avatarMesh,
        headBone,
        isReady: isCameraReady,
    });

    return (
        <primitive object={avatar} />
    );
}

export default UserAvatar;
