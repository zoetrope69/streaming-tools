import { h } from "preact";

import styles from "./ImmaBee.css";

const ImmaBee = ({ duration }) => (
  <div
    className={styles["ImmaBee-wrap"]}
    style={{ animationDuration: `${duration}ms` }}
  >
    <img
      className={styles.ImmaBee}
      src={`../../assets/alerts/immabee.png?${Math.random().toString()}`}
      alt="Bee"
    />
  </div>
);

export default ImmaBee;
