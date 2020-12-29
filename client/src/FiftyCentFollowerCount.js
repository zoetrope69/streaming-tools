import React from "react";

import "./FiftyCentFollowerCount.css";

const FiftyCentFollowerCount = ({ followTotal }) => (
  <div className="FiftyCentFollowerCount">
    <div class="FiftyCentFollowerCount__progress">
      <img
        className="FiftyCentFollowerCount__progress__background"
        src="50cent.png"
        alt=""
      />
      <div
        className="FiftyCentFollowerCount__progress__bar"
        style={{ height: `${(followTotal / 50) * 100}%` }}
      >
        <img src="50cent.png" alt="" />
      </div>
    </div>
    <span className="FiftyCentFollowerCount__target">
      {followTotal}cent / 50cent followers
    </span>
  </div>
);

export default FiftyCentFollowerCount;
