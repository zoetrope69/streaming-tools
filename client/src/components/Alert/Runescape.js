import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import styles from "./Runescape.css";

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Runescape = ({ duration }) => {
  const [positionStyles, setPositionStyles] = useState({
    top: `10%`,
    left: `10%`,
  });

  useEffect(() => {
    setPositionStyles({
      top: `${randomNumberBetween(10, 50)}%`,
      left: `${randomNumberBetween(10, 50)}%`,
    });
  }, []);

  const style = {
    ...positionStyles,
    animationDuration: `${duration}ms`,
  };

  return (
    <div className={styles.Runescape}>
      <div className={styles.RunescapeWrapper} style={style}>
        <img
          className={styles.RunescapeTextImage}
          src={`../../assets/alerts/runescape-text.gif?${Math.random().toString()}`}
          alt=""
        />
        <img
          className={styles.RunescapeTextImage}
          src={`../../assets/alerts/runescape-text.png?${Math.random().toString()}`}
          alt=""
        />
      </div>
    </div>
  );
};

export default Runescape;
