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
        width={130}
        height={16}
        path="M 0.15300946,6.7598343 C 1.8651286,-2.4742844 26.879561,0.68539274 60.389723,0.463661 96.543742,0.22479546 130.22493,-2.4722687 129.99887,8.4792631 129.8937,13.538778 126.84983,16 126.84983,16 H 2.9780899 c 0,0 -3.77647612,-4.112115 -2.82409759,-9.2401657 z"
      />

      <div className={styles.Music} style={MusicStyles}>
        <div className={MusicTextClassName} style={MusicTextStyles}>
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
