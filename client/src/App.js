import React, { useEffect, useState } from "react";
import openSocket from "socket.io-client";
import PrideFlag from "./PrideFlag";
import LastFMVisualiser from "./LastFMVisualiser";
import Alert from "./Alert";

import "./App.css";

const socket = openSocket("/");

function App() {
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState({});
  const [currentPrideFlagName, setCurrentPrideFlagName] = useState(
    "gay"
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
      console.log("data", data);

      const { twitchChatMessage, alert, track, prideFlagName } = data;

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

      if (prideFlagName) {
        setCurrentPrideFlagName(prideFlagName);
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

      {currentAlert && (
        <Alert
          alert={currentAlert}
          removeAlertFromQueue={removeAlertFromQueue}
        />
      )}
    </div>
  );
}

export default App;
