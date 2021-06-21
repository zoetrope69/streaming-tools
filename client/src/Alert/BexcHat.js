import React from "react";

import "./BexcHat.css";

const BexcHat = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.position) {
    return null;
  }

  const { x, y, width } = currentFaceDetection.position;
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
    <div className="BexcHat">
      <div className="BexcHat__hat--wrapper" style={positionStyles}>
        <div className="BexcHat__hat" />
      </div>
      <img
        className="BexcHat__heaven"
        src="/alerts/bexchat-heaven.png"
        alt=""
      />
      <img
        className="BexcHat__james-corden"
        src="/alerts/bexchat-james-corden.png"
        alt=""
      />
    </div>
  );
};

export default BexcHat;
