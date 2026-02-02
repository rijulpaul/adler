import { useRef, useEffect, useState } from "react";

export function useCamera(constraints = { video: { width: 640, height: 480 }, audio: false }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let mounted = true;

        async function initCamera() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);

                if (!mounted) {
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = newStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsReady(true);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to access camera:', err);
                    setError(err as Error);
                }
            }
        }

        initCamera();

        return () => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [constraints]);

    return { videoRef, isReady, error };
}
