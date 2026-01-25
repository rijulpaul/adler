import { useEffect, useRef } from 'react';

import './videoChatDebug.css'

import { detectFace } from '../../lib/trackers/faceTracker';
import { detectPose } from '../../lib/trackers/poseTracker';
import { detectHand } from '../../lib/trackers/handTracker';
import { draw } from '../../lib/trackers/utils';

function VideoChatDebug() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);
    const runningRef = useRef(false);

    // Initialize the video input source
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 360 },
                facingMode: "user",
            },
            audio: false
        })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error('Webcam access denied:', err);
            });
    }, []);

    const onVideoReady = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas internal resolution to match video source resolution
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
    };

    useEffect(() => {
        let rafId: number;

        const loop = async () => {
            // ... existing loop code ...
            if (runningRef.current) return;
            runningRef.current = true;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) {
                runningRef.current = false;
                return;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                runningRef.current = false;
                return;
            }

            // Ensure canvas matches video if likely not set yet (safety check)
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (frameRef.current % 3 === 0) {
                // calculate face every 3rd frame
                const faceResults = detectFace(video);
                draw(canvas, {
                    face: faceResults
                });
                // console.log(faceResults)
            } else if (frameRef.current % 3 === 1) {
                // calculate pose every 5th frame
                const handResults = detectHand(video);
                draw(canvas, {
                    hand: handResults
                });
                // console.log(handResults)
            } else if (frameRef.current % 3 === 2) {
                // calculate pose every 5th frame
                const poseResults = detectPose(video);
                draw(canvas, {
                    pose: poseResults
                });
                // console.log(poseResults)
            }

            frameRef.current++;
            runningRef.current = false;
            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <>
            <div className="video_container">
                <canvas ref={canvasRef} className='video_output' />
                <video
                    ref={videoRef}
                    className="video_input"
                    autoPlay
                    playsInline
                    onLoadedMetadata={onVideoReady}
                />
            </div>
        </>
    );
}

export default VideoChatDebug;
