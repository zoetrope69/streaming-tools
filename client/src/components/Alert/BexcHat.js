import { h } from "preact";

import styles from "./BexcHat.css";

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

const BexcHat = ({ currentFaceDetection }) => {
  const positionStyles = getPositionStyles(currentFaceDetection);

  return (
    <div className={styles.BexcHat}>
      <div
        className={styles["BexcHat__hat--wrapper"]}
        style={positionStyles}
      >
        <div className={styles["BexcHat__hat"]} />
      </div>
      <img
        className={styles["BexcHat__heaven"]}
        src="../../assets/alerts/bexchat-heaven.png"
        alt=""
      />
      <img
        className={styles["BexcHat__james-corden"]}
        src="../../assets/alerts/bexchat-james-corden.png"
        alt=""
      />
    </div>
  );
};

export default BexcHat;
