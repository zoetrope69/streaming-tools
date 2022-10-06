import { h } from "preact";

import styles from "./WordArt.css";

const WordArt = ({ duration, imageUrl }) => {
  const style = {
    animationDuration: `${duration}ms`,
  };

  return (
    <div className={styles.WordArt}>
      <img
        style={style}
        className={styles.WordArtImage}
        src={imageUrl}
        alt=""
      />
    </div>
  );
};

export default WordArt;
