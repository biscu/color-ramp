"use client";
import { useEffect, useState } from "react";
import * as color from "@k-vyn/coloralgorithm";
import colorContrast from 'color-contrast'

interface Props {
  steps: number;
  hue: {
    start: number;
    end: number;
    curve: string;
  };
  saturation: {
    start: number;
    end: number;
    curve: string;
    rate: number;
  };
  brightness: {
    start: number;
    end: number;
    curve: string;
  };
}

interface Options {
  minorSteps?: number[];
  lockHex?: string;
  rotation?: "clockwise" | "counterclockwise" | "cw" | "ccw";
}

interface Color {
  step: number;
  label: number;
  hex: string;
  hue: number;
  saturation: number;
  brightness: number;
  isMajor: boolean;
  isLocked: boolean;
  hsl: number[];
  hsv: number[];
  lab: number[];
  rgbString: string;
  rgbArray: number[];
  rgbaString: string;
  rgbaArray: number[];
}

// Converts a hexadecimal color string into its RGB representation.
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

// Converts RGB values into HSB (Hue, Saturation, Brightness) format.
function rgbToHsb(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  let v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s, b: v };
}

// Converts a hexadecimal color string directly into HSB format.
function hexToHsb(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, b: 0 };
  return rgbToHsb(rgb.r, rgb.g, rgb.b);
}

// Function to calculate contrast for generated colors
const calculateContrast = (colors: { hex: string; step: number }[], backgroundColor: string) => {
  const AA_CONTRAST_THRESHOLD = 4.5; // Redefine the threshold
  return colors.map((color: { hex: string; step: number }) => {
    const contrastValue: number = colorContrast(backgroundColor, color.hex); // Inverted: background is the generated color
    const roundedContrast = parseFloat(contrastValue.toFixed(2)); // Round to two decimal places
    const textColor = roundedContrast > AA_CONTRAST_THRESHOLD ? '#FFFFFF' : '#000000'; // Use white or black based on contrast
    const step = color.step * 100;
    return {
      color: color.hex,
      contrast: roundedContrast, // Use the rounded contrast value
      textColor: textColor,
      step: color.step * 100,
    };
  });
};

// Main component that manages color generation and state based on the provided props.
function App() {
  const [colors, setColors] = useState<Color[]>([]);
  const [lockHex, setLockHex] = useState("#1FA846");
  const { h } = hexToHsb(lockHex);

  const props: Props = {
    steps: 11,
    hue: {
      start: h,
      end: h,
      curve: "linear",
    },
    saturation: {
      start: 0.04,
      end: 1,
      curve: "linear",
      rate: 2,
    },
    brightness: {
      start: 1,
      end: 0.11,
      curve: "linear",
    },
  };

  const options: Options = {
    minorSteps: [0, 1],
    lockHex,
    rotation: "clockwise",
  };

  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);

  useEffect(() => {
    // @ts-ignore - Ignore type checking for the generate function call
    const result = color.generate(props, options);
    if (result && result.length > 0 && "colors" in result[0]) {
      // @ts-expect-error - Error is expected here
      setColors(result[0].colors);
      console.log("Color Values:", result[0].colors);
      console.log("HSB Values for lock hex:", hexToHsb(lockHex));
    } else {
      console.error("Result is not defined or empty."); // Log an error if result is invalid
    }
  }, [lockHex]);

  const backgroundColor = '#FFFFFF'; // Example background color
  const colorContrasts = calculateContrast(colors, backgroundColor);

  // Find the first color with sufficient contrast
  const firstSufficientContrast = colorContrasts.find(({ contrast }) => contrast > 4.5);

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="flex gap-2 items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Rally Ramp Generator
            </h1>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-600">
                Lock Hex:
              </span>

              <div className="flex items-center">
                <span className="px-3 py-2 text-neutral-800 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                  #
                </span>
                <input
                  type="text"
                  value={lockHex.replace("#", "")}
                  onChange={(e) => {
                    const value = "#" + e.target.value;
                    if (isValidHex(value)) {
                      setLockHex(value);
                    }
                  }}
                  className="px-3 py-2 w-24 rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-neutral-800 text-neutral-800"
                />
              </div>

              <span className="ml-4 text-sm font-medium text-gray-600">
                Converted Hue:
              </span>
              <span className="font-mono text-sm text-neutral-800">{h}°</span>
            </div>

            <ul className="h-[632px] bg-neutral-50">
              {colorContrasts.map(({ color, contrast, textColor, step }, index) => (
                <li className="p-3 flex items-center" key={color} style={{ backgroundColor: color, color: textColor }}>
                  {`${step}, Text: ${textColor}, Background: ${color}, Contrast: ${contrast}`}
                  {firstSufficientContrast && firstSufficientContrast.color === color && (
                    <span className="p-1 px-3 rounded-full justify-end bg-white text-black ml-auto">Candidate</span> // Badge for sufficient contrast
                  )}
                </li>
              ))}
            </ul>

            <div className="p-4 mt-4 bg-gray-50 rounded-md">
              <h2 className="mb-2 text-sm font-medium text-gray-700">
                Color Information
              </h2>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• Check the console for detailed color values</p>
                <p>
                  • Repo used:{" "}
                  <a
                    className="underline"
                    href="https://github.com/k-vyn/coloralgorithm"
                  >
                    https://github.com/k-vyn/coloralgorithm
                  </a>
                </p>
                <p>
                  • Generated {colors.length} colors with{" "}
                  {colors.filter((c) => c.isMajor).length} major steps
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
