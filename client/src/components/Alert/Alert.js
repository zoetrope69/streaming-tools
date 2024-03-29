import { h } from "preact";
import { useEffect } from "preact/hooks";

import Axolotl from "./Axolotl";
import ImmaBee from "./ImmaBee";
import Runescape from "./Runescape";
import Snowball from "./Snowball";
import WordArt from "./WordArt";

import axolotlStyles from "./Axolotl.css";

const DEFAULT_DURATION = 5000;

const Alert = ({ alert, currentFaceDetection }) => {
  const { id, type, user, audioUrl, delayAudio, duration, imageUrl } =
    alert;

  useEffect(() => {
    if (!id && !type) {
      return;
    }

    let audioTimeout;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.preload = true;

      audioTimeout = setTimeout(() => {
        audio.addEventListener(
          "canplaythrough",
          () => {
            audio.play();
          },
          false
        );
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

  if (type === "immabee") {
    return <ImmaBee duration={duration} />;
  }

  if (type === "snowball") {
    return (
      <Snowball
        id={id}
        duration={duration}
        currentFaceDetection={currentFaceDetection}
      />
    );
  }

  if (type === "runescape") {
    return <Runescape duration={duration} />;
  }

  if (type === "word-art") {
    return <WordArt duration={duration} imageUrl={imageUrl} />;
  }

  return null;
};

export default Alert;
