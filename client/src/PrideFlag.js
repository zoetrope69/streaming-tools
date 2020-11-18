import React, { Fragment, useEffect, useState } from "react";
import classNames from "classnames";

import "./PrideFlag.css";

const FADE_DURATION_MILLISECONDS = 1000;

const PRIDE_FLAGS = [
  "pride",
  "agender",
  "aromantic",
  "asexual",
  "bisexual",
  "genderfluid",
  "genderqueer",
  "intersex",
  "lesbian",
  "non-binary",
  "pansexual",
  "polysexual",
  "transgender",
];

const PrideFlag = ({ name }) => {
  const [isNewFlagShown, setIsNewFlagShown] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");
  const [currentName, setCurrentName] = useState("rainbow");

  useEffect(() => {
    if (PRIDE_FLAGS.includes(name)) {
      if (name !== currentName) {
        setNewFlagName(name);
        setIsNewFlagShown(true);
        setTimeout(() => {
          setCurrentName(name);
          setIsNewFlagShown(false);
        }, FADE_DURATION_MILLISECONDS);
      }
    }
  }, [name]);

  const PrideFlagClassName = classNames("PrideFlag", {
    [`PrideFlag--${currentName}`]: true,
  });

  const NewPrideFlagClassName = classNames(
    "PrideFlag PrideFlag--new",
    {
      [`PrideFlag--${newFlagName}`]: true,
    }
  );

  const NewPrideFlagStyles = {
    animationDuration: `${FADE_DURATION_MILLISECONDS}ms`,
  };

  return (
    <Fragment>
      <div className={PrideFlagClassName} />
      {isNewFlagShown && (
        <div
          style={NewPrideFlagStyles}
          className={NewPrideFlagClassName}
        />
      )}
    </Fragment>
  );
};

export default PrideFlag;
