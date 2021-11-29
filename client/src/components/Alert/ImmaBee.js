import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import styles from "./ImmaBee.css";

const ImmaBee = ({ duration }) => {
  const [randNumber, setRandNumber] = useState("");

  useEffect(() => {
    setRandNumber(Math.random().toString());
  }, []);

  return (
    <div
      className={styles["ImmaBee-wrap"]}
      style={{ animationDuration: `${duration}ms` }}
    >
      <img
        className={styles.ImmaBee}
        src={`../../assets/alerts/immabee.png?${randNumber}`}
        alt="Bee"
      />
    </div>
  );
};

export default ImmaBee;
