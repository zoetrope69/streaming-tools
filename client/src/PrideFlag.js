import React, { Fragment, useEffect, useState } from "react";
import classNames from "classnames";

import SVGClipPath from "./SVGClipPath";

import "./PrideFlag.css";

const FADE_DURATION_MILLISECONDS = 1000;

const PRIDE_FLAGS = [
  "agender",
  "aromantic",
  "asexual",
  "bisexual",
  "gay",
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
  const [currentName, setCurrentName] = useState("gay");

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
  }, [name, currentName]);

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
      <SVGClipPath
        componentName="PrideFlag"
        width="1920"
        height="50"
        path="M0 0h1920v33.287c-753.833 48.539-1408.825-26.81-1920 0z"
      />

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
