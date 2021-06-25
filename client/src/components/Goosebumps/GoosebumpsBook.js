import { h } from "preact";

import styles from "./GoosebumpsBook.css";

const GoosebumpsBook = () => (
  <div className={styles["GoosebumpsBook-container"]}>
    <div className={styles.GoosebumpsBook}>
      <img
        src={`../../assets/goosebumps/book.jpg?${Math.random().toString()}`}
        alt=""
      />
    </div>
  </div>
);

export default GoosebumpsBook;
