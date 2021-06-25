import { h } from "preact";
import { useEffect } from "preact/hooks";

import Axolotl from "./Axolotl";
import BexcHat from "./BexcHat";
import BigData from "./BigData";
import CylonRaider from "./CylonRaider";
import ImmaBee from "./ImmaBee";
import PenguinThrow from "./PenguinThrow";
import PhilPunch from "./PhilPunch";

import axolotlStyles from "./Axolotl.css";

const DEFAULT_DURATION = 5000;

const Alert = ({ alert, currentFaceDetection }) => {
  const { id, type, user, audioUrl, delayAudio, duration } = alert;

  useEffect(() => {
    if (!id && !type) {
      return;
    }

    let audioTimeout;
    if (audioUrl) {
      audioTimeout = setTimeout(() => {
        const audio = new Audio(audioUrl);
        audio.play();
      }, delayAudio || 0);
    }

    setTimeout(() => {
      clearTimeout(audioTimeout);
    }, duration || DEFAULT_DURATION);

    return () => {
      clearTimeout(audioTimeout);
    };
  }, [id, type, audioUrl, duration, delayAudio]);

  if (!id && !type) {
    return null;
  }

  if (type === "bits") {
    return (
      <Axolotl duration={duration}>
        thanks for the bits <br />
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
        thanks for {alert.isGift ? "gifting " : ""}the sub <br />
        <strong>{user.username}</strong>
      </Axolotl>
    );
  }

  if (type === "donation") {
    return (
      <Axolotl duration={duration}>
        thanks for the donation <br />
        {alert.isAnonymous ? (
          "bill gates"
        ) : (
          <strong>{user.username}</strong>
        )}
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

  if (type === "raid") {
    return (
      <Axolotl duration={duration}>
        hi <strong>{user.username}</strong> <br />
        thanks for raid!
      </Axolotl>
    );
  }

  if (type === "shout-out") {
    return (
      <Axolotl duration={duration}>
        shout out to <br /> <strong>{user.username}</strong>!
        <img
          className={axolotlStyles["Axolotl__speech-bubble__avatar"]}
          src={user.image}
          alt=""
        />
        {user.pronouns && (
          <span
            className={
              axolotlStyles["Axolotl__speech-bubble__pronouns"]
            }
          >
            {user.pronouns}
          </span>
        )}
      </Axolotl>
    );
  }

  if (type === "say") {
    return (
      <Axolotl
        message={alert.message}
        duration={duration}
        containsHTML
      >
        {alert.messageWithEmotes}
      </Axolotl>
    );
  }

  if (type === "bexchat") {
    return <BexcHat currentFaceDetection={currentFaceDetection} />;
  }

  if (type === "bigdata") {
    return <BigData duration={duration} />;
  }

  if (type === "cylon-raider") {
    return (
      <CylonRaider currentFaceDetection={currentFaceDetection} />
    );
  }

  if (type === "immabee") {
    return <ImmaBee duration={duration} />;
  }

  if (type === "penguin-throw") {
    return (
      <PenguinThrow
        id={id}
        duration={duration}
        currentFaceDetection={currentFaceDetection}
      />
    );
  }

  if (type === "philpunch") {
    return <PhilPunch>{alert.message}</PhilPunch>;
  }

  return null;
};

export default Alert;