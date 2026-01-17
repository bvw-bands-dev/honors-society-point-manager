/*
 * Blue Flame's Honors Society Point Manager
 * Copyright (C) 2026 Blue Flame
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

type ThemeColors = Record<
  string,
  {
    primary: string; // oklch color string
    foreground: "white" | "black";
  }
>;

// OKLCH values for Tailwind's 500 colors (approximate)
export const tailwindColors = {
  neutral: "oklch(0.56 0.00 0)",
  stone: "oklch(0.55 0.01 58)",
  zinc: "oklch(0.55 0.01 286)",
  slate: "oklch(0.55 0.04 257)",
  gray: "oklch(0.55 0.02 264)",
  red: "oklch(0.64 0.21 25)",
  orange: "oklch(0.77 0.16 60)",
  amber: "oklch(0.77 0.16 70)",
  yellow: "oklch(0.80 0.16 86)",
  lime: "oklch(0.77 0.20 131)",
  green: "oklch(0.72 0.19 150)",
  emerald: "oklch(0.70 0.15 162)",
  teal: "oklch(0.70 0.12 183)",
  cyan: "oklch(0.71 0.13 215)",
  sky: "oklch(0.8 0.15 237)",
  blue: "oklch(0.8 0.14 260)",
  indigo: "oklch(0.7 0.15 277)",
  violet: "oklch(0.61 0.22 293)",
  purple: "oklch(0.63 0.23 304)",
  fuchsia: "oklch(0.67 0.26 322)",
  pink: "oklch(0.65 0.22 16)",
  rose: "oklch(0.65 0.22 16)",
};

// Get contrast based on OKLCH lightness
function getContrastOKLCH(oklch: string): "white" | "black" {
  // oklch(L C H)
  const match = /oklch\(([\d.]+)\s+[\d.]+\s+[\d.]+\)/.exec(oklch);
  if (!match) return "black";
  const lightness = parseFloat(match[1]);
  // Threshold: 0.7 is a reasonable split for white/black foreground
  return lightness >= 1 ? "black" : "white";
}

export const themeColors: ThemeColors = Object.fromEntries(
  Object.entries(tailwindColors).map(([color, oklch]) => {
    const primary = oklch;
    const foreground = getContrastOKLCH(primary);
    return [color, { primary, foreground }];
  }),
);

export function pickPrimary(color: keyof typeof themeColors) {
  return themeColors[color].primary;
}

export function pickForeground(color: keyof typeof themeColors) {
  return themeColors[color].foreground;
}
