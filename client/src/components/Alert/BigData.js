import { h } from "preact";

import styles from "./BigData.css";

const BigData = ({ duration }) => (
  <img
    style={{ animationDuration: `${duration}ms` }}
    className={styles.BigData}
    src="../../assets/alerts/bigdata.png"
    alt="Big Data"
  />
);

export default BigData;
