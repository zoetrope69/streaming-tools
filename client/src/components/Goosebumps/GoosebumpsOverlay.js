import styles from "./GoosebumpsOverlay.css";

const GoosebumpsOverlay = ({ bookTitle }) => (
  <div className={styles["GoosebumpsOverlay"]}>
    <div className={styles["GoosebumpsOverlay-column"]}>
      <span className={styles["GoosebumpsOverlay-column__title"]}>
        direct
      </span>
      <span
        className={styles["GoosebumpsOverlay-column__small-text"]}
      >
        New book
      </span>
      <span
        className={styles["GoosebumpsOverlay-column__book-title"]}
      >
        {bookTitle}
      </span>

      <span className={styles["GoosebumpsOverlay-column__price"]}>
        19<small>95</small>
      </span>
      <span
        className={styles["GoosebumpsOverlay-column__small-text"]}
      >
        Not available in stores
      </span>

      <hr />

      <span
        className={styles["GoosebumpsOverlay-column__small-text"]}
      >
        Includes free
      </span>
      <span
        className={styles["GoosebumpsOverlay-column__book-title"]}
      >
        Goosebumps Lunchbox
      </span>
    </div>

    <div className={styles["GoosebumpsOverlay-bottom-row"]}>
      <span
        className={
          styles["GoosebumpsOverlay-bottom-row__left-message"]
        }
      >
        30 Day Money-Back Guarantee!
      </span>
      <span
        className={
          styles["GoosebumpsOverlay-bottom-row__phone-number"]
        }
      >
        twitch.tv/ninja
      </span>

      <span className={styles["GoosebumpsOverlay-bottom-row__logo"]}>
        FART
      </span>
    </div>
  </div>
);

export default GoosebumpsOverlay;
