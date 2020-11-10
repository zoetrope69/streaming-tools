import React, { useEffect, useState } from "react";
import classNames from "classnames";

import "./LastFMVisualiser.css";

const LastFMVisualiser = ({ currentTrack }) => {
  const [track, setTrack] = useState({});
  const [isHidden, setIsHidden] = useState(true);
  const [isHiding, setIsHiding] = useState(false);
  const {
    albumArtURL,
    albumArtColors,
    trackName,
    artistName,
  } = track;

  useEffect(() => {
    // if we've stopped playing the current song and a new song starts playing
    if (!track?.isNowPlaying && currentTrack?.isNowPlaying) {
      // show the track
      setTrack(currentTrack);
      setIsHidden(false);
      return;
    }

    if (track?.isNowPlaying) {
      if (
        track.id !== currentTrack?.id &&
        currentTrack?.isNowPlaying
      ) {
        setIsHiding(true);
        setTimeout(() => {
          setIsHiding(false);
          setIsHidden(true);

          setTrack(currentTrack);
          setIsHidden(false);
        }, 500);
      }
    }
  }, [track, currentTrack]);

  const LastFMVisualiserClassName = classNames("LastFMVisualiser", {
    "LastFMVisualiser--hiding": isHiding,
  });

  if (isHidden) {
    return null;
  }

  console.log("albumArtColors", albumArtColors);

  return (
    <div
      className={LastFMVisualiserClassName}
      style={
        albumArtColors
          ? { background: albumArtColors.darkestColor }
          : {}
      }
    >
      <img
        className="LastFMVisualiser__image"
        src={albumArtURL}
        alt=""
      />
      <p
        className="LastFMVisualiser__text"
        style={
          albumArtColors
            ? { color: albumArtColors.brightestColor }
            : {}
        }
      >
        {trackName} — {artistName}
      </p>
      <span className="LastFMVisualiser__command">
        !song <img src="SingsNoteEmote.png" alt="" />
      </span>
    </div>
  );
};

export default LastFMVisualiser;
