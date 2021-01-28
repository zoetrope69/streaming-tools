import React, { useEffect, useState } from "react";
import openSocket from "socket.io-client";
import PrideFlag from "./PrideFlag";
import PopUpMessage from "./PopUpMessage";
import LastFMVisualiser from "./LastFMVisualiser";
import Alert from "./Alert";
// import DebugFace from "./DebugFace";

import "./App.css";

const socket = openSocket("/");

function App() {
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState({});
  const [currentPopUpMessage, setCurrentPopUpMessage] = useState("");
  const [currentPrideFlagName, setCurrentPrideFlagName] = useState(
    "gay"
  );
  const [currentFaceDetection, setCurrentFaceDetection] = useState(
    {}
  );
  const [currentAlert] = alertQueue;

  const removeAlertFromQueue = (alertId) => {
    const newAlertQueue = alertQueue.filter(
      (alert) => alert.id !== alertId
    );
    setAlertQueue(newAlertQueue);
  };

  useEffect(() => {
    const addToAlertQueue = (alert) => {
      const newAlertQueue = alertQueue.concat([alert]);
      setAlertQueue(newAlertQueue);
    };

    const socketIOHandler = (data) => {
      // console.log("data", data);

      const {
        alert,
        track,
        prideFlagName,
        popUpMessage,
        faceDetection,
      } = data;

      if (alert) {
        if (!alert.loadImage) {
          addToAlertQueue(alert);
        } else {
          const alertImage = new Image();
          alertImage.addEventListener("load", () => {
            addToAlertQueue(alert);
          });
          alertImage.src = alert.loadImage;
        }
      }

      if (track?.id !== currentTrack?.id) {
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
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, [alertQueue, currentTrack]);

  return (
    <div className="App">
      <PrideFlag name={currentPrideFlagName} />
      <LastFMVisualiser currentTrack={currentTrack} />
      <PopUpMessage>{currentPopUpMessage}</PopUpMessage>
      {/* <DebugFace currentFaceDetection={currentFaceDetection} /> */}

      {currentAlert && (
        <Alert
          alert={currentAlert}
          currentFaceDetection={currentFaceDetection}
          removeAlertFromQueue={removeAlertFromQueue}
        />
      )}
    </div>
  );
}

export default App;
