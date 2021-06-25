import { h } from "preact";

import styles from "./CylonRaider.css";

const CylonRaider = ({ currentFaceDetection }) => {
  if (!currentFaceDetection || !currentFaceDetection.position) {
    return null;
  }

  const { x, y, width: faceWidth } = currentFaceDetection.position;
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
      src="../../assets/alerts/cylon-raider.png"
      alt=""
      className={styles.CylonRaider}
      style={positionStyles}
    />
  );
};

export default CylonRaider;
