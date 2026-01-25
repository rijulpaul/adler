import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

function ChatEnvironment() {
    const { camera } = useThree();

    useEffect(() => {
        // initial camera setup at 150 cm height and 40 cm from face.
        camera.position.set(0, 1.5, 0.4);
    }, [camera.position])

    return (
        <>
            <color attach="background" args={["#202020"]} />
            <ambientLight intensity={1} />
        </>
    )
}

export default ChatEnvironment;