/*

  import namedColors from "color-name-list";
  
  this doesnt work in ESM because its a JSON file

  until importing JSON directly in ESM works we'll do
  this filth instead
  */
import importJSON from "./import-json.js";
const namedColors = await importJSON(
  new URL(
    "../../node_modules/color-name-list/dist/colornames.json",
    import.meta.url
  )
);

const LIGHT_XY_COLOR_MAP = {
  red: [0.6744, 0.3],
  orange: [0.5855, 0.3879],
  yellow: [0.4953, 0.4556],
  green: [0.1938, 0.6821],
  "light green": [0.2762, 0.5474],
  blue: [0.139, 0.081],
  "light blue": [0.2042, 0.2562],
  purple: [0.2519, 0.1238],
  pink: [0.3362, 0.2001],
  // other colours
  white: [0.3129, 0.3291],
  warm: [0.4575, 0.4099],
};

export function getDefinedXYFromColorName(name) {
  if (!name) {
    return;
  }

  return LIGHT_XY_COLOR_MAP[name];
}

export function colorNameToHex(name) {
  if (!name) {
    return;
  }

  const namedColor = namedColors.find(
    (color) => color.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (!namedColor) {
    return;
  }

  return namedColor.hex;
}

const RGB_HEX =
  /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;

export function hexToRgb(str) {
  if (!str) {
    return;
  }

  const [, short, long] = String(str).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return [value >> 16, (value >> 8) & 0xff, value & 0xff];
  } else if (short) {
    return Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
  }
}

/**
 * based on from: https://gist.github.com/mjackson/5311256
 *
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 *
 * hue is 0 - 360
 * saturation and lightness are 0 - 100
 *
 * returns r, g, and b in an array [0, 255].
 */

export function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(hslArray) {
  const normalisedHSLArray = [
    hslArray[0] / 360,
    hslArray[1] / 100,
    hslArray[2] / 100,
  ];
  const [hue, saturation, lightness] = normalisedHSLArray;
  let r, g, b;

  // is achromatic
  if (saturation === 0) {
    r = g = b = lightness;
  } else {
    let q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    let p = 2 * lightness - q;

    r = hue2rgb(p, q, hue + 1 / 3);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1 / 3);
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
}

/**
 * based on design docs from Philips:
 * https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md
 *
 * Hue Bulbs use CIE colour instead of something like RGB
 * that we'd use in a computer screen display
 *
 * for the hue bulb the corners of the triangle are:
 * + red: 0.675, 0.322
 * + green: 0.4091, 0.518
 * + blue: 0.167, 0.04
 */
export function rgbToXY(rgbArray) {
  if (!rgbArray) {
    return;
  }

  const normalisedRGBArray = rgbArray.map((value) => value / 255);
  const [redValue, greenValue, blueValue] = normalisedRGBArray;

  let red;
  let green;
  let blue;

  // Make red more vivid
  if (redValue > 0.04045) {
    red = Math.pow((redValue + 0.055) / (1.0 + 0.055), 2.4);
  } else {
    red = redValue / 12.92;
  }

  // Make green more vivid
  if (greenValue > 0.04045) {
    green = Math.pow((greenValue + 0.055) / (1.0 + 0.055), 2.4);
  } else {
    green = greenValue / 12.92;
  }

  // Make blue more vivid
  if (blueValue > 0.04045) {
    blue = Math.pow((blueValue + 0.055) / (1.0 + 0.055), 2.4);
  } else {
    blue = blueValue / 12.92;
  }

  const X = red * 0.649926 + green * 0.103455 + blue * 0.197109;
  const Y = red * 0.234327 + green * 0.743075 + blue * 0.022598;
  const Z = red * 0.0 + green * 0.053077 + blue * 1.035763;

  if (X === 0 && Y === 0 && Z === 0) {
    return [0, 0];
  }

  const x = X / (X + Y + Z);
  const y = Y / (X + Y + Z);

  function roundTo4DecimalPlaces(value) {
    return Math.round(value * 10000) / 10000;
  }

  return [roundTo4DecimalPlaces(x), roundTo4DecimalPlaces(y)];
}

export function hslToXY(hsl) {
  const rgb = hslToRgb(hsl);
  return rgbToXY(rgb);
}

export function colorNameToXY(name) {
  if (!name) {
    return;
  }

  const definedXY = getDefinedXYFromColorName(name);
  if (definedXY) {
    return definedXY;
  }

  const hex = colorNameToHex(name);
  const rgb = hexToRgb(hex);
  return rgbToXY(rgb);
}

export function hexToXY(hex) {
  const rgb = hexToRgb(hex);
  return rgbToXY(rgb);
}
