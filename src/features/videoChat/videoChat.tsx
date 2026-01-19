import { useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";


function VideoChat() {
    return (
        <>
            <Canvas style={{ width: "80vw", height: "80vh" }}>
                <VideoChatEnvironment />
            </Canvas>
        </>
    );
}

function VideoChatEnvironment() {
    const { scene: avatar } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");
    const { camera } = useThree();

    useEffect(() => {
        // initial camera setup at 150 cm height and 40 cm from face.
        camera.position.set(0, 1.5, 0.4);
    }, [camera.position])

    return (
        <>
            <primitive object={avatar} position={[0, 0, 0]} />
            <color attach="background" args={["#202020"]} />
            <ambientLight intensity={1} />
        </>
    )
}

export default VideoChat;