import React, { useEffect, useState } from "react";
import classNames from "classnames";

import "./PopUpMessage.css";

const TRANSITION_DURATION = 1000; // ms

const PopUpMessage = ({ children: currentMessage }) => {
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
      className={classNames("PopUpMessage", {
        "PopUpMessage--hiding": isHiding,
      })}
      style={{
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      <img
        className="PopUpMessage__rabbit"
        src="/rabbit-grass.gif"
        alt=""
      />
      <p
        className="PopUpMessage__sign"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
};

export default PopUpMessage;
