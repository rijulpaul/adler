import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import ChatEnvironment from "./ChatEnvironment";
import UserAvatar from "./UserAvatar";
import { useCamera } from "../hooks/useCamera";

function VideoChat() {
    const { videoRef, isReady, error } = useCamera();

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <video
                ref={videoRef}
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "30vh",
                    // width: "100vw",
                    zIndex: 100,
                    // opacity: 0,
                    pointerEvents: "none"
                }}
                playsInline
                muted
            />

            {error && (
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "red",
                    background: "rgba(0,0,0,0.7)",
                    padding: "1rem",
                    borderRadius: "8px"
                }}>
                    Error accessing camera: {error.message}
                </div>
            )}

            <Canvas style={{ width: "80vw", height: "80vh", display: "block" }} camera={{ near: 0.1, far: 1000 }}>
                <UserAvatar videoRef={videoRef} isCameraReady={isReady} />
                <ChatEnvironment />
                <Stats />
            </Canvas>
        </div>
    );
}

export default VideoChat;
