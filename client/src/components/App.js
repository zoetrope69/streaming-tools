import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { io } from "socket.io-client";

import Alert from "./Alert";
import Goosebumps from "./Goosebumps";
// import DebugFace from "./DebugFace";
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

  useEffect(() => {
    const socketIOHandler = async (data) => {
      // eslint-disable-next-line no-console
      console.log("data", data);

      const {
        alert,
        track,
        prideFlagName,
        popUpMessage,
        faceDetection,
        goosebumpsBookTitle,
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
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, []);

  return (
    <div className={styles.App}>
      {currentAlert && (
        <Alert
          alert={currentAlert}
          currentFaceDetection={currentFaceDetection}
        />
      )}

      {/* <DebugFace currentFaceDetection={currentFaceDetection} /> */}
      <Goosebumps bookTitle={currentGoosebumpsBookTitle} />
      <PopUpMessage currentMessage={currentPopUpMessage} />
      <PrideFlag name={currentPrideFlagName} />
      <Music currentTrack={currentTrack} />
    </div>
  );
}

export default App;
