import { h } from "preact";

import styles from "./Goosebumps.css";

import GoosebumpsOverlay from "./GoosebumpsOverlay";
import GoosebumpsBook from "./GoosebumpsBook";

const Goosebumps = ({ bookTitle }) => {
  if (!bookTitle) {
    return null;
  }

  return (
    <div className={styles.Goosebumps}>
      <GoosebumpsOverlay bookTitle={bookTitle} />
      <GoosebumpsBook />
    </div>
  );
};

export default Goosebumps;
