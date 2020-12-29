import React from "react";

import "./FiftyCentFollowerCount.css";

const FiftyCentFollowerCount = ({ followTotal }) => (
  <div className="FiftyCentFollowerCount">
    <img
      className="FiftyCentFollowerCount__background"
      src="50cent.png"
      alt=""
    />
    <div
      className="FiftyCentFollowerCount__bar"
      style={{ height: `${(followTotal / 50) * 100}%` }}
    >
      <img src="50cent.png" alt="" />
    </div>
    <span className="FiftyCentFollowerCount__target">
      {followTotal}cent / 50cent followers
    </span>
  </div>
);

export default FiftyCentFollowerCount;
