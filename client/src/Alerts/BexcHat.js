import React from "react";

import "./BexcHat.css";

const BexcHat = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.rect) {
    return null;
  }

  const { x, y, width } = currentFaceDetection.rect;
  const height = width * 0.77;

  const positionStyles = {
    transform: `translate(
      ${x}px,
      ${y - height / 2}px
    )`,
    width: `${width}px`,
    height: `${height}px`,
  };

  return (
    <div className="BexcHat" style={positionStyles}>
      <div className="BexcHat__hat" />
    </div>
  );
};

export default BexcHat;
