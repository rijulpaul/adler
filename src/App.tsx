import { useEffect, useState, useRef } from 'react';
import './App.css'
import faceTracker from './components/trackers/faceTracker';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showVideo,setShowVideo] = useState<boolean>(false);


  // Initialize the video input source
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        videoRef.current!.srcObject = stream;
      })
      .catch(err => {
        console.error('Webcam access denied:', err);
      });
  }, []);

  useEffect(()=> {
        setInterval(() => faceTracker(videoRef.current,canvasRef.current), 200);
    }, []);

  return (
    <>
      <div>
        <canvas ref={canvasRef} className='video_output'/>
        <video ref={videoRef} hidden={showVideo} className="video_input" autoPlay playsInline/>
        <div>
          <button onClick={() => setShowVideo(!showVideo)}>Show Original Video</button>
        </div>
      </div>
    </>
  )
}

export default App
