const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
if (IS_DEVELOPMENT) {
  // Must use require here as import statements are only allowed
  // to exist at top-level.
  require("preact/debug"); // eslint-disable-line no-undef
}

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { io } from "socket.io-client";

import LeapMotion from "./helpers/LeapMotion";

import Alert from "./Alert";
import Bubblewrap from "./Bubblewrap";
import Dancers from "./Dancers";
import Debug from "./Debug";
import Goosebumps from "./Goosebumps";
import PopUpMessage from "./PopUpMessage";
import PrideFlag from "./PrideFlag";
import Music from "./Music";

import styles from "./App.css";

const socket = io("/");

async function loadImage(image) {
  return new Promise((resolve) => {
    const alertImage = new Image();
    alertImage.addEventListener("load", () => {
      resolve();
    });
    alertImage.src = image;
  });
}

function App() {
  const [isConnectedToServer, setIsConnectedToServer] =
    useState(false);
  const [currentAlert, setCurrentAlert] = useState({});
  const [currentTrack, setCurrentTrack] = useState({});
  const [currentPopUpMessage, setCurrentPopUpMessage] = useState("");
  const [currentPrideFlagName, setCurrentPrideFlagName] =
    useState("gay");
  const [currentFaceDetection, setCurrentFaceDetection] = useState(
    {}
  );
  const [currentGoosebumpsBookTitle, setCurrentGoosebumpsBookTitle] =
    useState(null);
  const [currentDancers, setCurrentDancers] = useState([]);
  const [bubblewrap, setCurrentBubblewrap] = useState({
    enabled: false,
  });
  const [motionTrackedPointables, setMotionTrackedPointables] =
    useState([]);

  useEffect(() => {
    const socketIOHandler = async (data) => {
      // eslint-disable-next-line no-console
      console.log("[Client] Data sent from server", data);

      const {
        alert,
        track,
        prideFlagName,
        popUpMessage,
        faceDetection,
        goosebumpsBookTitle,
        dancers,
        bubblewrap,
      } = data;

      if (alert) {
        if (alert.loadImage) {
          await loadImage(alert.loadImage);
        }

        setCurrentAlert(alert);
      }

      if (track) {
        if (track.albumArtURL) {
          await loadImage(track.albumArtURL);
        }
        setCurrentTrack(track);
      }

      if (typeof popUpMessage === "string") {
        setCurrentPopUpMessage(popUpMessage);
      }

      if (prideFlagName) {
        setCurrentPrideFlagName(prideFlagName);
      }

      if (faceDetection) {
        setCurrentFaceDetection(faceDetection);
      }

      if (typeof goosebumpsBookTitle !== "undefined") {
        setCurrentGoosebumpsBookTitle(goosebumpsBookTitle);
      }

      if (dancers) {
        setCurrentDancers(dancers);
      }

      if (bubblewrap) {
        setCurrentBubblewrap(bubblewrap);
      }
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, []);

  useEffect(() => {
    const socketIOHandler = () => {
      // eslint-disable-next-line no-console
      console.log("[Client] Connected to server");
      setIsConnectedToServer(true);
    };
    socket.on("connected-to-server", socketIOHandler);

    return () => {
      socket.off("connected-to-server", socketIOHandler);
    };
  }, [setIsConnectedToServer]);

  useEffect(() => {
    let leapMotion;

    if (isConnectedToServer) {
      leapMotion = LeapMotion(socket);

      leapMotion.controller.on("frame-throttled", (frame) => {
        const newHandData = frame.pointables.map((pointable) => {
          const hand = frame.hands.find(
            (hand) => hand.id === pointable.handId
          );
          return {
            id: pointable.id,
            position: pointable.screenPosition(),
            rotation: hand ? hand.roll() : 0,
            isExtended: pointable.extended,
            isFinger: pointable.finger,
          };
        });
        setMotionTrackedPointables(newHandData);
      });
    }

    return () => {
      if (leapMotion) leapMotion.disconnectController();
    };
  }, [isConnectedToServer, setMotionTrackedPointables]);

  return (
    <div className={styles.App}>
      {IS_DEVELOPMENT && (
        <Debug
          currentFaceDetection={currentFaceDetection}
          motionTrackedPointables={motionTrackedPointables}
        />
      )}

      {currentAlert && (
        <Alert
          alert={currentAlert}
          currentFaceDetection={currentFaceDetection}
        />
      )}
      {bubblewrap.isEnabled && (
        <Bubblewrap
          isStopping={bubblewrap.isStopping}
          bubbles={bubblewrap.bubbles}
        />
      )}
      <Dancers
        currentTrack={currentTrack}
        dancers={currentDancers}
        motionTrackedPointables={motionTrackedPointables}
      />
      <Goosebumps bookTitle={currentGoosebumpsBookTitle} />
      <PopUpMessage currentMessage={currentPopUpMessage} />
      <PrideFlag name={currentPrideFlagName} />
      <Music currentTrack={currentTrack} />
    </div>
  );
}

export default App;
