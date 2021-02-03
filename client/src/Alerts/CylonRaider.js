import React from "react";

import "./CylonRaider.css";

const CylonRaider = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.rect) {
    return null;
  }

  const { x, y, width: faceWidth } = currentFaceDetection.rect;
  const width = faceWidth * 8.8;
  const height = width / 3;

  const positionStyles = {
    transform: `translate(
      ${x - (width - faceWidth) / 2}px,
      ${y - height / 4}px
    )`,
    width: `${width}px`,
    height: `${height}px`,
  };

  return (
    <img
      src="/alerts/cylon-raider.png"
      alt=""
      className="CylonRaider"
      style={positionStyles}
    />
  );
};

export default CylonRaider;
