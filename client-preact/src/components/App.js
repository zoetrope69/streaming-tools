import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import openSocket from "socket.io-client";

import PrideFlag from "./PrideFlag";

// import "./App.css";

const socket = openSocket("/");

function App() {
  const [currentPrideFlagName, setCurrentPrideFlagName] =
    useState("gay");

  useEffect(() => {
    const socketIOHandler = (data) => {
      console.log("data", data);

      const { prideFlagName } = data;

      if (prideFlagName) {
        setCurrentPrideFlagName(prideFlagName);
      }
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, []);

  return (
    <div className="App">
      <PrideFlag name={currentPrideFlagName} />
    </div>
  );
}

export default App;
