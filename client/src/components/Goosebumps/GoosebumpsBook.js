import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import styles from "./GoosebumpsBook.css";

const GoosebumpsBook = () => {
  const [randNumber, setRandNumber] = useState("");

  useEffect(() => {
    setRandNumber(Math.random().toString());
  }, []);

  return (
    <div className={styles["GoosebumpsBook-container"]}>
      <div className={styles.GoosebumpsBook}>
        <img
          src={`../../assets/goosebumps/book.jpg?${randNumber}`}
          alt=""
        />
      </div>
    </div>
  );
};

export default GoosebumpsBook;
