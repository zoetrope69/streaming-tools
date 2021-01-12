import React, { useEffect } from "react";
import Axolotl from "./Alerts/Axolotl";
import BigData from "./Alerts/BigData";
import ImmaBee from "./Alerts/ImmaBee";
import PhilPunch from "./Alerts/PhilPunch";

const DEFAULT_DURATION = 5000;

const ALERT_TYPES = {
  "shout-out": {
    duration: 5000,
  },
  bits: {
    duration: 5000,
  },
  subscribe: {
    duration: 5000,
  },
  follow: {
    duration: 5000,
  },
  say: {
    duration: 5000,
  },
  bigdata: {
    audio: new Audio("bigdata.mp3"),
    duration: 6000,
  },
  immabee: {
    audio: new Audio("immabee.mp3"),
    duration: 4000,
  },
  "fuck-2020": {
    audio: new Audio("fuck-2020.mp3"),
    duration: 3000,
  },
  philpunch: {
    audio: new Audio("phil-punch.mp3"),
    duration: 5000,
    delayAudio: 1000,
  },
};

const Alert = ({ alert, removeAlertFromQueue }) => {
  const { id, type, user } = alert;
  const alertType = ALERT_TYPES[type];
  const { duration } = alertType;

  useEffect(() => {
    if (!alertType) {
      return;
    }

    let audioTimeout;
    if (alertType.audio) {
      audioTimeout = setTimeout(() => {
        alertType.audio.play();
      }, alertType.delayAudio || 0);
    }

    setTimeout(() => {
      clearTimeout(audioTimeout);
      removeAlertFromQueue(id);
    }, duration || DEFAULT_DURATION);
  }, [user, type, alertType, id, duration, removeAlertFromQueue]);

  if (!alertType) {
    return null;
  }

  if (type === "bigdata") {
    return <BigData duration={duration} />;
  }

  if (type === "immabee") {
    return <ImmaBee duration={duration} />;
  }

  if (type === "bits") {
    return (
      <Axolotl duration={duration}>
        thanks for the bits{" "}
        {alert.isAnonymous ? (
          "bill gates"
        ) : (
          <strong>{user.username}</strong>
        )}
      </Axolotl>
    );
  }

  if (type === "subscribe") {
    return (
      <Axolotl duration={duration}>
        thanks for {alert.isGift ? "gifting " : ""}the sub{" "}
        <strong>{user.username}</strong>
      </Axolotl>
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
        shout out to <br /> <strong>{user.username}</strong>!
        <img src={user.image} alt="" />
      </Axolotl>
    );
  }

  if (type === "say") {
    return <Axolotl duration={duration}>{alert.message}</Axolotl>;
  }

  if (type === "philpunch") {
    return <PhilPunch>{alert.message}</PhilPunch>;
  }

  return null;
};

export default Alert;
