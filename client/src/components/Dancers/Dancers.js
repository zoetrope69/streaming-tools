import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import styles from "./styles.css";

function randomPosition() {
  const MIN_NUMBER = 10;
  const MAX_NUMBER = 50;
  const randNumberBetween =
    Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
  return randNumberBetween;
}

const Dancer = ({ user, beatsPerMillisecond }) => {
  const [position, setPosition] = useState({ left: 0, right: 0 });
  const [color, setColor] = useState("white");
  const [isVisible, setIsVisible] = useState(false);
  const { left, top } = position;
  const animationDuration = beatsPerMillisecond
    ? `${beatsPerMillisecond}ms`
    : "0s";

  useEffect(() => {
    if (position.left !== 0 && position.top !== 0) {
      return;
    }

    setPosition({
      left: `${randomPosition()}%`,
      top: `${randomPosition()}%`,
    });

    setColor(`hsl(${Math.floor(Math.random() * 360)}, 50%, 65%)`);

    setIsVisible(true);
  }, [position]);

  const dancerClassnames = classNames(styles.Dancer, {
    [styles.DancerShowAndHide]: isVisible,
  });

  return (
    <div
      className={dancerClassnames}
      style={{
        left,
        top,
      }}
    >
      <div className={styles.DancerShadow} />
      <div
        className={styles.DancerHead}
        style={{
          backgroundImage: `url("${user.image}")`,
          animationDuration,
          borderColor: color,
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

const Dancers = ({ dancers, currentTrack = {} }) => {
  const { beatsPerMillisecond, isNowPlaying } = currentTrack;

  const dancersClassname = classNames(styles.Dancers, {
    [styles.DancersHidden]: !isNowPlaying || !beatsPerMillisecond,
  });

  return (
    <div className={dancersClassname}>
      {dancers.map((user) => (
        <Dancer
          key={user.id}
          user={user}
          beatsPerMillisecond={beatsPerMillisecond}
        />
      ))}
    </div>
  );
};

export default Dancers;
