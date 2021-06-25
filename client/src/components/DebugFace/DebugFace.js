import { h } from "preact";

const DebugFace = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.position) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        border: "2px solid red",
        color: "red",
        left: `${currentFaceDetection.position.x}px`,
        top: `${currentFaceDetection.position.y}px`,
        width: `${currentFaceDetection.position.width}px`,
        height: `${currentFaceDetection.position.height}px`,
      }}
    >
      {currentFaceDetection.confidence}
    </div>
  );
};

export default DebugFace;
