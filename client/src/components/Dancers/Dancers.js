import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import styles from "./styles.css";

const IMAGE_SIZE = 400;
const IMAGE_WIDTH = IMAGE_SIZE;
const IMAGE_HEIGHT = IMAGE_SIZE;

function randomPosition(min, max) {
  const randNumberBetween = Math.floor(Math.random() * max) + min;
  return randNumberBetween;
}

const Dancer = ({
  index,
  user,
  beatsPerMillisecond,
  motionTrackedPointable,
}) => {
  const [transformStyles, setTransformStyles] = useState({});
  const [color, setColor] = useState("white");
  const animationDuration = beatsPerMillisecond
    ? `${beatsPerMillisecond}ms`
    : "0s";

  function getTransformStyles([handLeft, handTop], rotation) {
    const left = `${Math.floor(handLeft - IMAGE_WIDTH / 2)}px`;
    const top = `${Math.floor(handTop - IMAGE_HEIGHT / 2)}px`;
    return {
      transform: `translate(${left}, ${top}) rotate(${-rotation}rad) scale(0.5)`,
    };
  }

  useEffect(() => {
    if (!motionTrackedPointable) {
      return;
    }

    if (motionTrackedPointable) {
      const [handLeft, handTop] = motionTrackedPointable.position;

      setTransformStyles(
        getTransformStyles(
          [handLeft, handTop + window.innerHeight],
          motionTrackedPointable.rotation
        )
      );
    }
  }, [motionTrackedPointable, setTransformStyles, index]);

  useEffect(() => {
    setTransformStyles(
      getTransformStyles(
        [
          randomPosition(0, window.innerWidth - IMAGE_WIDTH),
          randomPosition(0, window.innerHeight - IMAGE_HEIGHT),
        ],
        0
      )
    );

    setColor(`hsl(${Math.floor(Math.random() * 360)}, 50%, 65%)`);
  }, [setTransformStyles]);

  return (
    <div className={styles.Dancer} style={transformStyles}>
      <div className={styles.DancerShadow} />
      <div
        className={styles.DancerHead}
        style={{
          backgroundImage: `url("${user.image}")`,
          backgroundColor: color,
          borderColor: color,
          animationDuration,
        }}
      />
      <svg width="400" height="400" viewBox="0 0 400 400">
        <circle
          id="DancerHandLeft"
          className={styles.DancerHand}
          fill={color}
          cx="50"
          cy="250"
          r="25"
        />
        <path
          id="DancerArmLeft"
          className={styles.DancerLimb}
          stroke={color}
          d="M 200,200 50,250"
        >
          <animate
            attributeName="d"
            values="M 200,200 50,250;M 200,250 50,250;M 200,200 50,250"
            begin={animationDuration}
            dur={animationDuration}
            repeatCount="indefinite"
          />
        </path>
        <circle
          id="DancerHandRight"
          className={styles.DancerHand}
          fill={color}
          cx="350"
          cy="250"
          r="25"
        />
        <path
          id="DancerArmRight"
          className={styles.DancerLimb}
          stroke={color}
          d="M 200,200 350,250"
        >
          <animate
            attributeName="d"
            values="M 200,200 350,250;M 200,250 350,250;M 200,200 350,250"
            begin={animationDuration}
            dur={animationDuration}
            repeatCount="indefinite"
          />
        </path>

        <circle
          id="DancerFootLeft"
          className={styles.DancerFoot}
          fill={color}
          cx="150"
          cy="375"
          r="25"
        />
        <path
          id="DancerLegLeft"
          className={styles.DancerLimb}
          stroke={color}
          d="M 200,200 150,375"
        />
        <circle
          id="DancerFootRight"
          className={styles.DancerFoot}
          fill={color}
          cx="250"
          cy="375"
          r="25"
        />
        <path
          id="DancerLegRight"
          className={styles.DancerLimb}
          stroke={color}
          d="M 200,200 250,375"
        />
      </svg>
    </div>
  );
};

const Dancers = ({
  dancers,
  currentTrack = {},
  motionTrackedPointables,
}) => {
  const { beatsPerMillisecond, isNowPlaying } = currentTrack;

  const dancersClassname = classNames(styles.Dancers, {
    [styles.DancersHidden]: !isNowPlaying,
  });

  return (
    <div className={dancersClassname}>
      {dancers.map((user, i) => (
        <Dancer
          key={user.id + i}
          user={user}
          beatsPerMillisecond={beatsPerMillisecond}
          motionTrackedPointable={
            motionTrackedPointables.filter(
              (p) => p.isExtended === true && p.isFinger === true
            )[i]
          }
        />
      ))}
    </div>
  );
};

export default Dancers;
