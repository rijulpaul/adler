import { useState } from "react";
import VideoChat from "./features/videoChat/videoChat";
import VideoChatDebug from "./features/videoChat/videoChatDebug";

function App() {
  const [isDebug, setIsDebug] = useState(false);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {
          isDebug ?
            <VideoChatDebug /> :
            <VideoChat />
        }
      </div>
      <div><button onClick={() => setIsDebug(!isDebug)}>Toggle Debug</button></div>
    </>
  )
}

export default App;