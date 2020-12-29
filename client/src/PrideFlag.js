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
        width={10.054}
        height={232.833}
        path="M0 0h10.054v232.833H0c3.597-26.789.54-53.866.771-80.776C-.147 118.36 3.914 84.764 2.612 51.07 2.217 34.026 1.232 17.002 0 0z"
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
