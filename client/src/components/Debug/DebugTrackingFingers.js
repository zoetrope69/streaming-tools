import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

function DebugTrackingHands({ finger }) {
  const [transformStyles, setTransformStyles] = useState({
    display: "none",
  });

  const HEIGHT = 200;
  const WIDTH = 200;

  function getTransformStyles([fingerLeft, fingerTop], rotation) {
    const left = `${fingerLeft - WIDTH / 2}px`;
    const top = `${fingerTop - HEIGHT / 2 + window.innerHeight}px`;
    return {
      position: "absolute",
      left: 0,
      top: 0,
      transform: `translate(${left}, ${top}) rotate(${-rotation}rad)`,
      opacity: 1,
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      border: "4px yellow solid",
      borderRadius: "50%",
    };
  }

  useEffect(() => {
    setTransformStyles(
      getTransformStyles(finger.position, finger.rotation)
    );
  }, [finger]);

  return <div style={transformStyles} />;
}

export default DebugTrackingHands;
