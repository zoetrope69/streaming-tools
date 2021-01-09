import React from "react";

import "./PhilPunch.css";

const PhilPunch = ({ children }) => (
  <div class="PhilPunch">
    <div class="PhilPunch__text">
      <p>{children}</p>
    </div>

    <img
      className="PhilPunch__image"
      src="phil-punch.gif"
      alt="Phil"
    />
  </div>
);

export default PhilPunch;
