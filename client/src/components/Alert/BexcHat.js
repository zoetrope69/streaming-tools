import { h } from "preact";

import styles from "./BexcHat.css";

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
