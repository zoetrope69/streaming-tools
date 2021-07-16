import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import truncate from "../helpers/truncate";
import SVGClipPath from "../helpers/SVGClipPath";

import styles from "./Music.css";

const TRANSITION_DURATION = 500;

const Music = ({ currentTrack }) => {
  const [track, setTrack] = useState({});
  const [isHiding, setIsHiding] = useState(true);
  const { albumArtURL, albumArtColors, trackName, artistName } =
    track;

  useEffect(() => {
    let timeout;

    const isNewTrack = track?.id !== currentTrack?.id;
    const hasChangedPlayingState =
      track?.isNowPlaying !== currentTrack?.isNowPlaying;

    console.log({
      track,
      currentTrack,
      isNewTrack,
      hasChangedPlayingState,
      result: isNewTrack || hasChangedPlayingState,
    });

    if (isNewTrack || hasChangedPlayingState) {
      if (currentTrack?.isNowPlaying) {
        setIsHiding(true);

        timeout = setTimeout(() => {
          setTrack(currentTrack);
          setIsHiding(false);
        }, TRANSITION_DURATION + 50);
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

  const MusicTextClassName = classNames(styles["Music__text"], {
    [styles.isHiding]: isHiding,
  });
  const MusicImageClassName = classNames(styles["Music__image"], {
    [styles.isHiding]: isHiding,
  });

  const MusicStyles = {
    transitionDuration: `${TRANSITION_DURATION}ms`,
  };
  const MusicTextStyles = {};
  const MusicTextLabelStyles = {};

  if (albumArtColors) {
    MusicTextStyles.background = albumArtColors.darkestColor;
    MusicTextLabelStyles.color = albumArtColors.brightestColor;
  }

  if (trackName && trackName.length > 30) {
    MusicTextLabelStyles.fontSize = "0.85em";
  }

  return (
    <Fragment>
      <SVGClipPath
        componentName="Music"
        width={132.292}
        height={15.875}
        path="M.179 6.707C1.921-2.455 27.372.68 61.467.46c36.785-.237 71.054-2.913 70.824 7.953-.107 5.02-3.204 7.355-3.204 7.355l-126.606.107S-.789 11.795.18 6.707z"
      />

      <div className={styles.Music} style={MusicStyles}>
        <div className={MusicTextClassName} style={MusicTextStyles}>
          <span className={styles["Music__text__label__command"]}>
            !song
          </span>
          <p
            className={styles["Music__text__label"]}
            style={MusicTextLabelStyles}
          >
            {truncate(trackName, 50)}
            <span
              className={styles["Music__text__label__second-line"]}
            >
              {truncate(artistName, 40)}
            </span>
          </p>
        </div>
        <img
          className={MusicImageClassName}
          src={albumArtURL}
          alt=""
        />
      </div>
    </Fragment>
  );
};

export default Music;
