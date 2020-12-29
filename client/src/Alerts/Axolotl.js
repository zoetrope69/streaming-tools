import React, { useEffect } from "react";

import "./Axolotl.css";

const getTextFromChildren = (children) => {
  let text = "";

  React.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      text += child;
      return;
    }

    // if element has children get the text from it's children
    if (child.props.children) {
      text += getTextFromChildren(child.props.children);
    }
  });

  if (text.trim() === "") {
    return null;
  }

  return text;
};

const Axolotl = ({ children, duration }) => {
  useEffect(() => {
    if (window.sayAnimalese) {
      const text = getTextFromChildren(children);
      window.sayAnimalese(text);
    }
  }, [children]);

  return (
    <div
      className="Axolotl"
      style={{ animationDuration: `${duration}ms` }}
    >
      <img className="Axolotl__image" src="axolotl.png" alt="" />
      <div
        className="Axolotl__speech-bubble"
        style={{ animationDuration: `${duration}ms` }}
      >
        <img
          className="Axolotl__speech-bubble__image"
          src="speech-bubble-body.svg"
          alt=""
        />
        <p className="Axolotl__speech-bubble__text">{children}</p>
      </div>
    </div>
  );
};

export default Axolotl;
