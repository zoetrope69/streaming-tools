import { h } from "preact";

import styles from "./ZacYouStink.css";

const ANIMATION_DURATION = 1000;

function getPositionStyles(currentFaceDetection) {
  if (!currentFaceDetection || !currentFaceDetection.position) {
    return {
      transform: `translate(60vw, 20vh)`,
      width: "10vw",
      height: "10vw",
    };
  }

  const { x, y, width } = currentFaceDetection.position;
  const height = width * 0.77;

  return {
    transform: `translate(
      ${x}px,
      ${y - height / 2}px
    )`,
    width: `${width}px`,
    height: `${height}px`,
  };
}

const ZacYouStink = ({ duration, currentFaceDetection }) => {
  const positionStyles = getPositionStyles(currentFaceDetection);

  return (
    <div
      className={styles.ZacYouStink}
      style={{
        animationDuration: `${ANIMATION_DURATION}ms`,
        animationDelay: `${duration - ANIMATION_DURATION}ms`,
      }}
    >
      <div
        className={styles["ZacYouStink__fly"]}
        style={positionStyles}
      />
    </div>
  );
};

export default ZacYouStink;
