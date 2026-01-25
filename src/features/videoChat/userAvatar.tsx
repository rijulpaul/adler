import { useGLTF } from "@react-three/drei";

function UserAvatar() {
    const { scene: avatar } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");

    return (
        <>
            <primitive object={avatar} />
        </>
    )
}

export default UserAvatar;
