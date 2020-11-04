import React, { useEffect, useState } from "react";
import classNames from "classnames";

import "./KeyboardVisualiser.css";

const KeyboardVisualiser = ({ keys }) => {
  const [text, setText] = useState("");
  const [isHidden, setIsHidden] = useState(true);
  const { keysHeld = [], key } = keys;

  useEffect(() => {
    const formattedKeys = [...keysHeld, key].join(" + ");

    const hasText = formattedKeys.trim().length !== 0;
    setIsHidden(!hasText);

    if (hasText) {
      setText(formattedKeys);
    }
  }, [key, keysHeld]);

  const className = classNames("Box KeyboardVisualiser", {
    "KeyboardVisualiser-hide": isHidden,
  });

  return <div className={className}>{text}</div>;
};

export default KeyboardVisualiser;
