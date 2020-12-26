import React from "react";

const SVGClipPath = ({ componentName, width, height, path }) => (
  <svg viewBox={`0 0 ${width} ${height}`}>
    <defs>
      <clipPath
        id={`${componentName}-clip`}
        clipPathUnits="objectBoundingBox"
        transform={`scale(${1 / width} ${1 / height})`}
      >
        <path d={path} />
      </clipPath>
    </defs>
  </svg>
);

export default SVGClipPath;
