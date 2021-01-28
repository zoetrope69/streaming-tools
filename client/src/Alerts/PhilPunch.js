import React, { useEffect, useState } from "react";

import "./PhilPunch.css";

const PhilPunch = ({ children }) => {
  const [showPhil, setShowPhil] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShowPhil(true);

      setTimeout(() => {
        setShowPhil(false);
      }, 1700);
    }, 1000);
  }, []);

  return (
    <div class="PhilPunch">
      <div class="PhilPunch__text">
        <p>{children}</p>
      </div>

      {showPhil && (
        <img
          className="PhilPunch__image"
          src="/alerts/phil-punch.gif"
          alt="Phil"
        />
      )}
    </div>
  );
};

export default PhilPunch;
