import React, { Fragment, useEffect, useState } from "react";
import classNames from "classnames";

import SVGClipPath from "./SVGClipPath";

import "./LastFMVisualiser.css";

function truncate(text, amount = 100) {
  if (text.length < amount) {
    return text;
  }

  return text.substring(0, amount) + "...";
}

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

  return (
    <Fragment>
      <SVGClipPath
        componentName="LastFMVisualiser"
        width="132.292"
        height="15.875"
        path="M.179 6.707C1.921-2.455 27.372.68 61.467.46c36.785-.237 71.054-2.913 70.824 7.953-.107 5.02-3.204 7.355-3.204 7.355l-126.606.107S-.789 11.795.18 6.707z"
      />

      <div
        className={LastFMVisualiserClassName}
        style={
          albumArtColors
            ? { background: albumArtColors.darkestColor }
            : {}
        }
      >
        <p
          className="LastFMVisualiser__text"
          style={
            albumArtColors
              ? { color: albumArtColors.brightestColor }
              : {}
          }
        >
          {truncate(trackName, 20)}
          <span className="LastFMVisualiser__text__second-line">
            {truncate(artistName, 40)}
          </span>
        </p>
        <img
          className="LastFMVisualiser__image"
          src={albumArtURL}
          alt=""
        />
        <span className="LastFMVisualiser__command">!song</span>
      </div>
    </Fragment>
  );
};

export default LastFMVisualiser;
