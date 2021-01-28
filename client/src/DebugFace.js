import React from "react";

const DebugFace = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.rect) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        border: "2px solid red",
        color: "red",
        left: `${currentFaceDetection.rect.x}px`,
        top: `${currentFaceDetection.rect.y}px`,
        width: `${currentFaceDetection.rect.width}px`,
        height: `${currentFaceDetection.rect.height}px`,
      }}
    >
      {currentFaceDetection.confidence}
    </div>
  );
};

export default DebugFace;
