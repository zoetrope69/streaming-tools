import React from "react";

import "./ImmaBee.css";

const ImmaBee = ({ duration }) => (
  <div
    className="ImmaBee-wrap"
    style={{ animationDuration: `${duration}ms` }}
  >
    <img
      className="ImmaBee"
      src={`/immabee.png?${Math.random().toString()}`}
      alt="Bee"
    />
  </div>
);

export default ImmaBee;
