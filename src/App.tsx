import { useEffect, useState, useRef } from 'react';

import './App.css'

import faceTracker from './components/trackers/faceTracker';
import poseTracker from './components/trackers/poseTracker';
import handTracker from './components/trackers/handTracker';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const runningRef = useRef(false);

  const [showVideo, setShowVideo] = useState<boolean>(false);


  // Initialize the video input source
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 480 },
        height: { ideal: 270 },
        facingMode: "user",
      },
      audio: false
    })
      .then(stream => {
        videoRef.current!.srcObject = stream;
      })
      .catch(err => {
        console.error('Webcam access denied:', err);
      });
  }, []);

  useEffect(() => {
    let rafId: number;

    const loop = async () => {
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (frameRef.current % 3 === 0) {
        // calculate face every 3rd frame
        await faceTracker(video, canvas);
      } else if (frameRef.current % 5 === 0) {
        // calculate pose every 5th frame
        await poseTracker(video, canvas);
        await handTracker(video, canvas);
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
      <div>
        <canvas ref={canvasRef} className='video_output' />
        <video ref={videoRef} hidden={showVideo} className="video_input" autoPlay playsInline />
        <div>
          <button onClick={() => setShowVideo(!showVideo)}>Show Original Video</button>
        </div>
      </div>
    </>
  )
}

export default App
