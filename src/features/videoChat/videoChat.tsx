import { Canvas } from "@react-three/fiber";
import ChatEnvironment from "./chatEnvironment";
import UserAvatar from "./userAvatar";

function VideoChat() {
    return (
        <>
            <Canvas style={{ width: "80vw", height: "80vh" }}>
                <UserAvatar />
                <ChatEnvironment />
            </Canvas>
        </>
    );
}

export default VideoChat;