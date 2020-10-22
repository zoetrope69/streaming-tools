import React, { useEffect, useState } from "react";
import classNames from "classnames";
import openSocket from "socket.io-client";
import logo from "./logo.svg";
import "./App.css";

const socket = openSocket("http://localhost:4000");

const KeyboardVisualiser = ({ keys }) => {
  const [text, setText] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const { keysHeld = [], key } = keys;

  useEffect(() => {
    const formattedKeys = [...keysHeld, key].join(" + ");

    const hasText = formattedKeys.trim().length !== 0;
    setIsHidden(!hasText);

    if (hasText) {
      setText(formattedKeys);
    }
  }, [key, keysHeld]);

  const className = classNames("KeyboardVisualiser", {
    "KeyboardVisualiser-hide": isHidden,
  });

  return <div className={className}>{text}</div>;
};

function App() {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    socket.on("keys", setKeys);
    socket.on("twitch-chat-message", (message) => {
      console.log(message);
    });
  }, []);

  return (
    <div className="App">
      <KeyboardVisualiser keys={keys} />
    </div>
  );
}

export default App;
