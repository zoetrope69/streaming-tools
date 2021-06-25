import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import styles from "./PhilPunch.css";

const PhilPunch = ({ children }) => {
  const [showPhil, setShowPhil] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowPhil(true);

      setTimeout(() => {
        setShowPhil(false);
      }, 1700);
    }, 1000);
  }, []);

  return (
    <div class={styles.PhilPunch}>
      <div class={styles["PhilPunch__text"]}>
        <p>{children}</p>
      </div>

      {showPhil && (
        <img
          className={styles["PhilPunch__image"]}
          src="../../assets/alerts/phil-punch.gif"
          alt="Phil"
        />
      )}
    </div>
  );
};

export default PhilPunch;
