import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import classNames from "classnames";

import styles from "./PenguinThrow.css";

const SNOWBALL_ANIMATION_DURATION = 300;
const PENGUIN_THROW_ANIMATION_DURATION = 750;

const PenguinThrow = ({ id, currentFaceDetection }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isFaceDetectionPaused, setIsFaceDetectionPaused] =
    useState(false);
  const [isTargetVisible, setIsTargetVisible] = useState(true);
  const [isSnowballVisible, setIsSnowballVisible] = useState(false);
  const [faceDetection, setFaceDetection] = useState(null);

  // onload
  useEffect(() => {
    setIsSnowballVisible(false);
    setIsTargetVisible(true);

    setTimeout(() => {
      setIsFaceDetectionPaused(true);
      setIsSnowballVisible(true);

      setTimeout(() => {
        setIsTargetVisible(false);
      }, SNOWBALL_ANIMATION_DURATION / 2);

      setTimeout(() => {
        setIsHidden(true);
      }, SNOWBALL_ANIMATION_DURATION);
    }, PENGUIN_THROW_ANIMATION_DURATION);
  }, [setIsSnowballVisible, setIsFaceDetectionPaused]);

  useEffect(() => {
    if (!isFaceDetectionPaused) {
      setFaceDetection(currentFaceDetection.position);
    }
  }, [isFaceDetectionPaused, setFaceDetection, currentFaceDetection]);

  const x = faceDetection ? faceDetection.x : 1025;
  const y = faceDetection ? faceDetection.y : 525;
  const width = Math.max(
    335,
    faceDetection ? faceDetection.width : 335
  );
  const height = Math.max(
    335,
    faceDetection ? faceDetection.height : 335
  );

  const positionStyles = {
    transform: `translate(
      ${x}px,
      ${y}px
    )`,
    width: `${width}px`,
    height: `${height}px`,
  };

  const PenguinThrowClassName = classNames(styles.PenguinThrow, {
    [styles["PenguinThrow--hidden"]]: isHidden,
  });

  return (
    <div className={PenguinThrowClassName}>
      <img
        className={styles["PenguinThrow__penguin"]}
        // dirty hack to get the gif to play again
        src={`../../assets/alerts/penguin-throw-penguin.gif?id=${id}`}
        alt=""
      />

      {isTargetVisible && (
        <div
          className={styles["PenguinThrow__target"]}
          style={positionStyles}
        />
      )}
      {isSnowballVisible && (
        <div
          className={styles["PenguinThrow__snowball"]}
          style={{
            ...positionStyles,
            transform: `${positionStyles.transform} scale(0.5)`,
            animationDuration: `${SNOWBALL_ANIMATION_DURATION}ms`,
          }}
        />
      )}
    </div>
  );
};

export default PenguinThrow;
