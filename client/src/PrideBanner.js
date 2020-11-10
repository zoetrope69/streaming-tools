import React, { useEffect, useState } from "react";
import classNames from "classnames";

import "./PrideBanner.css";

const PRIDE_BANNERS = [
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

const PrideBanner = ({ name }) => {
  const [currentName, setCurrentName] = useState();

  useEffect(() => {
    if (PRIDE_BANNERS.includes(name)) {
      setCurrentName(name);
    }
  }, [name]);

  const PrideBannerClassName = classNames("PrideBanner", {
    [`PrideBanner--${currentName}`]: true,
  });

  return <div className={PrideBannerClassName} />;
};

export default PrideBanner;
