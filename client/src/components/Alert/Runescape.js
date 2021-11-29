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
  const [randNumber, setRandNumber] = useState(0);

  useEffect(() => {
    setPositionStyles({
      top: `${randomNumberBetween(10, 50)}%`,
      left: `${randomNumberBetween(10, 50)}%`,
    });
    setRandNumber(randomNumberBetween(0, 1000));
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
          src={`../../assets/alerts/runescape-text.gif?${randNumber}`}
          alt=""
        />
        <img
          className={styles.RunescapeTextImage}
          src={`../../assets/alerts/runescape-text.png?${randNumber}`}
          alt=""
        />
      </div>
    </div>
  );
};

export default Runescape;
