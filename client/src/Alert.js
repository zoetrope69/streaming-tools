import React, { Fragment, useEffect } from "react";
import Axolotl from "./Alerts/Axolotl";
import BigData from "./Alerts/BigData";

const DEFAULT_DURATION = 1000;

const ALERT_TYPES = {
  "shout-out": {
    duration: 5000,
  },
  follow: {
    duration: 5000,
  },
  bigdata: {
    audio: "bigdata.mp3",
    duration: 6000,
  },
};

const Alert = ({ alert, removeAlertFromQueue }) => {
  const { id, type, user } = alert;
  const alertType = ALERT_TYPES[type];
  const { audio, duration } = alertType;

  useEffect(() => {
    if (!alertType) {
      return;
    }

    setTimeout(() => {
      removeAlertFromQueue(id);
    }, duration || DEFAULT_DURATION);
  }, [user, type, alertType, id, duration, removeAlertFromQueue]);

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

  if (type === "follow") {
    return (
      <Axolotl duration={duration}>
        hi <strong>{user.username}</strong> <br />
        thanks for following!
      </Axolotl>
    );
  }

  if (type === "shout-out") {
    return (
      <Axolotl duration={duration}>
        shout to <br /> <strong>{user.username}</strong>!
        <img src={user.image} alt="" />
      </Axolotl>
    );
  }

  return null;
};

export default Alert;
