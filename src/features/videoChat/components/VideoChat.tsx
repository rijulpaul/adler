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
                    left: 0,
                    opacity: 0,
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

            <Canvas style={{ width: "100vw", height: "100vh", display: "block" }}>
                <UserAvatar videoRef={videoRef} isCameraReady={isReady} />
                <ChatEnvironment />
                <Stats />
            </Canvas>
        </div>
    );
}

export default VideoChat;
