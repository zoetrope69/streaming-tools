import React, { useEffect, useState } from "react";
import openSocket from "socket.io-client";
import PrideBanner from "./PrideBanner";
import KeyboardVisualiser from "./KeyboardVisualiser";
import LastFMVisualiser from "./LastFMVisualiser";
import Alert from "./Alert";
import Cam from "./Cam";

import "./App.css";

const socket = openSocket("/");

function App() {
  const [keys, setKeys] = useState({});
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState({});
  const [
    currentPrideBannerName,
    setCurrentPrideBannerName,
  ] = useState("pride");
  const [currentAlert] = alertQueue;
  // TEST variables
  // const currentAlert = {
  //   id: "123",
  //   type: "follow",
  //   user: {
  //     username: "zaccolley",
  //   },
  // };

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
        prideBannerName,
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

      if (prideBannerName) {
        setCurrentPrideBannerName(prideBannerName);
      }

      if (twitchChatMessage) {
        console.log("twitchChatMessage", twitchChatMessage);
      }
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, [alertQueue, currentTrack]);

  return (
    <div className="App">
      <PrideBanner name={currentPrideBannerName} />
      <Cam />
      <KeyboardVisualiser keys={keys} />
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
