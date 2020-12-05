import React from "react";

import "./BigData.css";

const BigData = ({ duration }) => (
  <img
    style={{ animationDuration: `${duration}ms` }}
    className="BigData"
    src="bigdata.png"
    alt="Big Data"
  />
);

export default BigData;
