import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { io } from "socket.io-client";

import Alert from "./Alert";
import Goosebumps from "./Goosebumps";
// import DebugFace from "./DebugFace";
import PopUpMessage from "./PopUpMessage";
import PrideFlag from "./PrideFlag";
import SongInfo from "./SongInfo";

import styles from "./App.css";

const socket = io("/");

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
    const socketIOHandler = (data) => {
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
        if (!alert.loadImage) {
          setCurrentAlert(alert);
        } else {
          const alertImage = new Image();
          alertImage.addEventListener("load", () => {
            setCurrentAlert(alert);
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

      if (typeof goosebumpsBookTitle !== "undefined") {
        setCurrentGoosebumpsBookTitle(goosebumpsBookTitle);
      }
    };

    socket.on("data", socketIOHandler);

    return () => {
      socket.off("data", socketIOHandler);
    };
  }, [currentTrack]);

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
      <SongInfo currentTrack={currentTrack} />
    </div>
  );
}

export default App;
