import React from "react";

import "./Goosebumps.css";

import GoosebumpsOverlay from "./GoosebumpsOverlay";
import GoosebumpsBook from "./GoosebumpsBook";

const Goosebumps = ({ bookTitle }) => {
  if (!bookTitle) {
    return null;
  }

  return (
    <div className="Goosebumps">
      <GoosebumpsOverlay bookTitle={bookTitle} />
      <GoosebumpsBook />
    </div>
  );
};

export default Goosebumps;
