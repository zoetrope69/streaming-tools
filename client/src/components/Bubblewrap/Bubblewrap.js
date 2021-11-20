import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import styles from "./styles.css";

function playSoundQuick(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play();
}

function randNumber(min, max) {
  const randNumberBetween = Math.floor(Math.random() * max) + min;
  return randNumberBetween;
}

const BUBBLE_SIZE = 192;
const BUBBLE_ASSETS_PATH = "../../assets/bubblewrap";

const SOUNDS = {
  RUSTLE_SHORT: Object.assign(new Audio(), {
    preload: true,
    src: `${BUBBLE_ASSETS_PATH}/bubblewrap-rustle-short.mp3`,
  }),
  RUSTLE_LONG: Object.assign(new Audio(), {
    preload: true,
    volume: 0.85,
    loop: true,
    src: `${BUBBLE_ASSETS_PATH}/bubblewrap-rustle-long.mp3`,
  }),
  POPS: [
    new Audio(`${BUBBLE_ASSETS_PATH}/bubblewrap-pop-1.mp3`),
    new Audio(`${BUBBLE_ASSETS_PATH}/bubblewrap-pop-2.mp3`),
  ],
  POPS_MOUTH: [
    new Audio(`${BUBBLE_ASSETS_PATH}/bubblewrap-pop-mouth-1.mp3`),
    new Audio(`${BUBBLE_ASSETS_PATH}/bubblewrap-pop-mouth-2.mp3`),
    new Audio(`${BUBBLE_ASSETS_PATH}/bubblewrap-pop-mouth-3.mp3`),
  ],
};

// preload the sounds
SOUNDS.POPS.forEach((sound) => (sound.preload = true));
SOUNDS.POPS_MOUTH.forEach((sound) => (sound.preload = true));

const Bubble = ({ isPopped }) => {
  const [transformItems, setTransformItems] = useState([]);
  const [inlineStyles, setInlineStyles] = useState({
    width: `${BUBBLE_SIZE}px`,
    height: `${BUBBLE_SIZE}px`,
  });

  useEffect(() => {
    SOUNDS.RUSTLE_SHORT.play();
    SOUNDS.RUSTLE_LONG.play();

    return () => {
      SOUNDS.RUSTLE_LONG.pause();
      SOUNDS.RUSTLE_LONG.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const popInDelayMilliseconds = randNumber(0, 500);

    const newTransformItems = [
      `rotate(${randNumber(0, 360)}deg)`,
      `translate(${randNumber(0, 2)}%, ${randNumber(0, 2)}%)`,
    ];
    setTransformItems(newTransformItems);

    setInlineStyles((prevStyles) => ({
      ...prevStyles,
      opacity: 0,
      transform: [...newTransformItems, `scale(0.85)`].join(" "),
      transitionDuration: `${popInDelayMilliseconds}ms`,
      backgroundImage: `url("${BUBBLE_ASSETS_PATH}/bubble-${randNumber(
        1,
        2
      )}.png")`,
    }));

    const timeout = setTimeout(() => {
      setInlineStyles((prevStyles) => ({
        ...prevStyles,
        opacity: 1,
        transform: [...newTransformItems, `scale(1)`].join(" "),
      }));
    }, popInDelayMilliseconds);

    return () => {
      clearTimeout(timeout);
    };
  }, [setInlineStyles, setTransformItems]);

  useEffect(() => {
    if (!isPopped) {
      return;
    }

    playSoundQuick(SOUNDS.POPS[randNumber(0, SOUNDS.POPS.length)]);
    playSoundQuick(
      SOUNDS.POPS_MOUTH[randNumber(0, SOUNDS.POPS_MOUTH.length)]
    );

    setInlineStyles((prevStyles) => ({
      ...prevStyles,
      backgroundImage: `url("${BUBBLE_ASSETS_PATH}/bubble-${randNumber(
        1,
        3
      )}-popped.png")`,
      transform: [...transformItems, `scale(1.1)`].join(" "),
    }));

    const timeout = setTimeout(() => {
      setInlineStyles((prevStyles) => ({
        ...prevStyles,
        transform: [...transformItems, `scale(1)`].join(" "),
        opacity: 0.85,
      }));
    }, 166);

    return () => {
      clearTimeout(timeout);
    };
  }, [setInlineStyles, transformItems, isPopped]);

  const bubbleClassName = classNames(styles.Bubble, {
    [styles.BubbleIsPopped]: isPopped,
  });

  return <div style={inlineStyles} className={bubbleClassName} />;
};

const Bubblewrap = ({ isStopping, bubbles }) => {
  const className = classNames(styles.Bubblewrap, {
    [styles.BubblewrapHidden]: isStopping,
  });

  useEffect(() => {
    if (!isStopping) {
      return;
    }

    SOUNDS.RUSTLE_SHORT.play();
  }, [isStopping]);

  return (
    <div className={className}>
      {bubbles.map(({ id, isPopped }) => (
        <Bubble key={id} isPopped={isPopped} />
      ))}
    </div>
  );
};

export default Bubblewrap;
