import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import styles from "./PopUpMessage.css";

const TRANSITION_DURATION = 1000; // ms

const PopUpMessage = ({ currentMessage }) => {
  const [message, setMessage] = useState("");
  const [isHiding, setIsHiding] = useState(true);

  useEffect(() => {
    let timeout;

    if (message !== currentMessage) {
      if (currentMessage.length !== 0) {
        setIsHiding(true);

        timeout = setTimeout(
          () => {
            setMessage(currentMessage);
            setIsHiding(false);
          },
          message.length === 0 ? 0 : TRANSITION_DURATION + 50
        );
      } else {
        setIsHiding(true);
        timeout = setTimeout(() => {
          setMessage(currentMessage);
        }, TRANSITION_DURATION + 50);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [message, currentMessage]);

  return (
    <div
      className={classNames(styles.PopUpMessage, {
        [styles["PopUpMessage--hiding"]]: isHiding,
      })}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      <img
        className={styles["PopUpMessage__rabbit"]}
        src="../../assets/rabbit-grass.gif"
        alt=""
      />
      <p
        className={styles["PopUpMessage__sign"]}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
};

export default PopUpMessage;
