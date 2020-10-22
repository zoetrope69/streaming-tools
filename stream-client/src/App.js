import React, { useEffect, useState } from "react";
import openSocket from "socket.io-client";
import KeyboardVisualiser from "./KeyboardVisualiser";
import Alert from "./Alert";
import Cam from "./Cam";

import "./App.css";

const socket = openSocket("http://localhost:4000");

function App() {
  const [keys, setKeys] = useState({});
  const [alertQueue, setAlertQueue] = useState([]);
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
      const { keys, twitchChatMessage, alert } = data;
      if (keys) {
        setKeys(keys);
      }

      if (alert) {
        addToAlertQueue(alert);
      }

      if (twitchChatMessage) {
        console.log("twitchChatMessage", twitchChatMessage);
      }
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, [alertQueue]);

  return (
    <div className="App">
      <Cam />
      <KeyboardVisualiser keys={keys} />
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
