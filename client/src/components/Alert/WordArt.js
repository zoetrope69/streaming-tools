import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import styles from "./WordArt.css";

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const WordArt = ({ duration, imageUrl }) => {
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
    <div className={styles.WordArt}>
      <div className={styles.WordArtWrapper} style={style}>
        <img
          className={styles.WordArtTextImage}
          src={imageUrl}
          alt=""
        />
      </div>
    </div>
  );
};

export default WordArt;
