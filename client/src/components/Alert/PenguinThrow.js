import { h } from "preact";

import { useState, useEffect } from "preact/hooks";
import classNames from "classnames";

import styles from "./PenguinThrow.css";

const SNOWBALL_ANIMATION_DURATION = 300;
const PENGUIN_THROW_ANIMATION_DURATION = 750;

const PenguinThrow = ({ id, currentFaceDetection }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isTargetVisible, setIsTargetVisible] = useState(true);
  const [isSnowballVisible, setIsSnowballVisible] = useState(false);

  // onload
  useEffect(() => {
    setIsHidden(false);
    setIsSnowballVisible(false);
    setIsTargetVisible(true);

    setTimeout(() => {
      setIsSnowballVisible(true);

      setTimeout(() => {
        setIsTargetVisible(false);
      }, SNOWBALL_ANIMATION_DURATION / 2);

      setTimeout(() => {
        setIsHidden(true);
      }, SNOWBALL_ANIMATION_DURATION);
    }, PENGUIN_THROW_ANIMATION_DURATION);
  }, []);

  const x = currentFaceDetection?.position?.x || 500;
  const y =
    currentFaceDetection?.position?.y || window.innerHeight - 500;
  const width = Math.max(
    currentFaceDetection?.position?.width || 150,
    150
  );
  const height = Math.max(
    currentFaceDetection?.position?.height || 150,
    150
  );

  const positionStyles = {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
  };

  const penguinSnowballX = `-${x + width}px`;
  const penguinSnowballY = `${window.innerHeight - (y + height)}px`;
  const snowballStyles = {
    ...positionStyles,
    opacity: 0,
    transform: `translate(${penguinSnowballX}, ${penguinSnowballY}) scale(0.25)`,
    transitionDuration: `${SNOWBALL_ANIMATION_DURATION}ms`,
  };

  if (isSnowballVisible) {
    snowballStyles.opacity = 1;
    snowballStyles.transform = `translate(0) scale(0.75)`;
  }

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
      <div
        className={styles["PenguinThrow__snowball"]}
        style={snowballStyles}
      />
    </div>
  );
};

export default PenguinThrow;
