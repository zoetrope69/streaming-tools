import React, { useEffect, useState } from "react";
import openSocket from "socket.io-client";
import PrideFlag from "./PrideFlag";
import KeyboardVisualiser from "./KeyboardVisualiser";
import LastFMVisualiser from "./LastFMVisualiser";
import FiftyCentFollowerCount from "./FiftyCentFollowerCount";
import Alert from "./Alert";

import "./App.css";

const socket = openSocket("/");

function App() {
  const [currentFollowTotal, setCurrentFollowTotal] = useState();
  const [keys, setKeys] = useState({});
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

      const {
        keys,
        twitchChatMessage,
        alert,
        track,
        prideFlagName,
        followTotal,
      } = data;

      if (keys) {
        setKeys(keys);
      }

      if (alert) {
        addToAlertQueue(alert);
      }

      if (track?.id !== currentTrack?.id) {
        setCurrentTrack(track);
      }

      if (prideFlagName) {
        setCurrentPrideFlagName(prideFlagName);
      }

      if (twitchChatMessage) {
        console.log("twitchChatMessage", twitchChatMessage);
      }

      if (followTotal) {
        setCurrentFollowTotal(followTotal);
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
      <KeyboardVisualiser keys={keys} />
      <LastFMVisualiser currentTrack={currentTrack} />
      <FiftyCentFollowerCount followTotal={currentFollowTotal} />

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
