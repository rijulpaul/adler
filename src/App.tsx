import VideoChatDebug from "./features/videoChat/videoChatDebug";
import VideoChat from "./features/videoChat/videoChat";

function App() {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <VideoChat />
        <VideoChatDebug />
      </div>
    </>
  )
}

export default App;