import React, { Fragment, useEffect, useState } from "react";
import classNames from "classnames";
import truncate from "./helpers/truncate";
import SVGClipPath from "./SVGClipPath";

import "./LastFMVisualiser.css";

const TRANSITION_DURATION = 500;

const LastFMVisualiser = ({ currentTrack }) => {
  const [track, setTrack] = useState({});
  const [isHiding, setIsHiding] = useState(true);
  const {
    albumArtURL,
    albumArtColors,
    trackName,
    artistName,
  } = track;

  useEffect(() => {
    let timeout;

    if (track && currentTrack && track.id !== currentTrack.id) {
      if (currentTrack?.isNowPlaying) {
        setIsHiding(true);

        timeout = setTimeout(
          () => {
            setTrack(currentTrack);
            setIsHiding(false);
          },
          !track?.isNowPlaying ? 0 : TRANSITION_DURATION + 50
        );
      } else {
        setIsHiding(true);
        timeout = setTimeout(() => {
          setTrack(currentTrack || {});
        }, TRANSITION_DURATION + 50);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [track, currentTrack]);

  const LastFMVisualiserClassName = classNames("LastFMVisualiser", {
    "LastFMVisualiser--hiding": isHiding,
  });

  const LastFMVisualiserStyles = {
    transitionDuration: `${TRANSITION_DURATION}ms`,
  };
  const LastFMVisualiserTextStyles = {};

  if (albumArtColors) {
    LastFMVisualiserStyles.background = albumArtColors.darkestColor;
    LastFMVisualiserTextStyles.color = albumArtColors.brightestColor;
  }

  return (
    <Fragment>
      <SVGClipPath
        componentName="LastFMVisualiser"
        width={132.292}
        height={15.875}
        path="M.179 6.707C1.921-2.455 27.372.68 61.467.46c36.785-.237 71.054-2.913 70.824 7.953-.107 5.02-3.204 7.355-3.204 7.355l-126.606.107S-.789 11.795.18 6.707z"
      />

      <div
        className={LastFMVisualiserClassName}
        style={LastFMVisualiserStyles}
      >
        <p
          className="LastFMVisualiser__text"
          style={LastFMVisualiserTextStyles}
        >
          {truncate(trackName, 30)}
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
