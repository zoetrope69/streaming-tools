import React, { useEffect } from "react";

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
};

const Alert = ({ alert, removeAlertFromQueue }) => {
  const { id, type, user } = alert;
  const alertType = ALERT_TYPES[type];
  const { image, audio, duration, Text } = alertType;

  useEffect(() => {
    setTimeout(() => {
      removeAlertFromQueue(id);
    }, duration || DEFAULT_DURATION);
  }, [id, duration, removeAlertFromQueue]);

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
