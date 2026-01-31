import { Canvas } from "@react-three/fiber";
import ChatEnvironment from "./chatEnvironment";
import UserAvatar from "./userAvatar";
import { useRef, useEffect } from "react";
import { OrbitControls, Stats } from "@react-three/drei";

function VideoChat() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let mounted = true;
        let videoElement: HTMLVideoElement | null = null;

        async function initCamera() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });

                if (!mounted) {
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = newStream;
                if (videoRef.current) {
                    videoElement = videoRef.current;
                    videoElement.srcObject = stream;
                    // play() can return a promise that rejects if interrupted.
                    videoElement.play().catch(e => {
                        if (mounted) console.error("Error playing video:", e);
                    });
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to access camera:', err);
                }
            }
        }
        initCamera();

        return () => {
            mounted = false;
            // Immediate cleanup
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, []);

    return (
        <>
            <video ref={videoRef} style={{ display: "none" }} />
            {/* Hidden video element to provide camera stream */}

            <Canvas style={{ width: "80vw", height: "80vh", margin: "0 auto" }}>
                <UserAvatar videoRef={videoRef} />
                <ChatEnvironment />
                <OrbitControls />
                <Stats />
            </Canvas>
        </>
    );
}

export default VideoChat;