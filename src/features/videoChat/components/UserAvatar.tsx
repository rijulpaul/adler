import { useGLTF } from "@react-three/drei";
import { useAvatarRig } from "../hooks/useAvatarRig";

interface UserAvatarProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraReady: boolean;
}

function UserAvatar({ videoRef, isCameraReady }: UserAvatarProps) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    useAvatarRig({
        videoRef,
        nodes,
        isReady: isCameraReady,
    });

    return (
        <primitive object={avatar} />
    );
}

export default UserAvatar;
