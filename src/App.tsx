import { useRef } from 'react';
import './App.css'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      videoRef.current!.srcObject = stream;
    })
    .catch(err => {
      console.error('Webcam access denied:', err);
    });


  return (
    <>
      <video ref={videoRef} className="webcam" autoPlay playsInline></video>
    </>
  )
}

export default App
