import React from "react";

import "./GoosebumpsOverlay.css";

const GoosebumpsOverlay = ({ bookTitle }) => (
  <div className="GoosebumpsOverlay">
    <div className="GoosebumpsOverlay-column">
      <span className="GoosebumpsOverlay-column__title">
        ZAC direct
      </span>
      <span className="GoosebumpsOverlay-column__small-text">
        New book
      </span>
      <span className="GoosebumpsOverlay-column__book-title">
        {bookTitle}
      </span>

      <span className="GoosebumpsOverlay-column__price">
        19<small>95</small>
      </span>
      <span className="GoosebumpsOverlay-column__small-text">
        Not available in stores
      </span>

      <hr />

      <span className="GoosebumpsOverlay-column__small-text">
        Includes free
      </span>
      <span className="GoosebumpsOverlay-column__book-title">
        Goosebumps Lunchbox
      </span>
    </div>

    <div className="GoosebumpsOverlay-bottom-row">
      <span className="GoosebumpsOverlay-bottom-row__left-message">
        30 Day Money-Back Guarantee!
      </span>
      <span className="GoosebumpsOverlay-bottom-row__phone-number">
        twitch.tv/zactopus
      </span>

      <span className="GoosebumpsOverlay-bottom-row__logo">ZACD</span>
    </div>
  </div>
);

export default GoosebumpsOverlay;
