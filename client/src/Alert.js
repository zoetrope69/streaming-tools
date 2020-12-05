import React, { Fragment, useEffect } from "react";
import BigData from "./Alerts/BigData";

import "./Alert.css";

const DEFAULT_DURATION = 1000;

const ALERT_TYPES = {
  follow: {
    Text: ({ children }) => (
      <span>
        <strong>{children}</strong> just followed!
      </span>
    ),
    image: "yesyesseysey.gif",
    audio: "yesyesseysey.mp3",
    duration: 9000,
  },
  bigdata: {
    audio: "bigdata.mp3",
    duration: 6000,
  },
};

const Alert = ({ alert, removeAlertFromQueue }) => {
  const { id, type, user } = alert;
  const alertType = ALERT_TYPES[type];
  const { image, audio, duration, Text } = alertType;

  useEffect(() => {
    if (!alertType) {
      return;
    }

    setTimeout(() => {
      removeAlertFromQueue(id);
    }, duration || DEFAULT_DURATION);
  }, [alertType, id, duration, removeAlertFromQueue]);

  if (!alertType) {
    return null;
  }

  if (type === "bigdata") {
    return (
      <Fragment>
        {audio && <audio src={audio} autoPlay />}
        <BigData duration={duration} />
      </Fragment>
    );
  }

  return (
    <div className="Box FadeIn Alert">
      {audio && <audio src={audio} autoPlay />}
      {image && <img className="Alert__image" src={image} alt="" />}
      {user && (
        <span class="Alert__message">
          <Text>{user.username}</Text>
        </span>
      )}
    </div>
  );
};

export default Alert;
