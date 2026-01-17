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

import * as React from "react";
import { useEffect } from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(true);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

export const tailwindBreakpoints = {
  "2xs": 25,
  xs: 30,
  sm: 40,
  md: 48,
  lg: 64,
  xl: 80,
  "2xl": 96,
};

export const tailwindContainerBreakpoints = {
  "3xs": 16,
  "2xs": 18,
  xs: 20,
  sm: 24,
  md: 28,
  lg: 32,
  xl: 36,
  "2xl": 42,
  "3xl": 48,
  "4xl": 56,
  "5xl": 64,
  "6xl": 72,
  "7xl": 80,
  //
  xshort: 5,
  short: 10,
  tall: 20,
};

export function useTailwindBreakpoints({
  breakpoint,
  reverse = false,
}: {
  breakpoint: keyof typeof tailwindBreakpoints;
  reverse?: boolean;
}) {
  const [isBreakpoint, setIsBreakpoint] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${tailwindBreakpoints[breakpoint]}rem)`,
    );
    const onChange = () => {
      setIsBreakpoint(
        reverse
          ? window.innerWidth < tailwindBreakpoints[breakpoint] * 16
          : window.innerWidth >= tailwindBreakpoints[breakpoint] * 16,
      );
    };
    mql.addEventListener("change", onChange);
    setIsBreakpoint(
      reverse
        ? window.innerWidth < tailwindBreakpoints[breakpoint] * 16
        : window.innerWidth >= tailwindBreakpoints[breakpoint] * 16,
    );
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint, reverse]);

  return !!isBreakpoint;
}

export function useTailwindContainerBreakpoints({
  breakpoint,
  ref,
  reverse = false,
  useHeight = false,
  forceUpdates = false,
}: {
  breakpoint: keyof typeof tailwindContainerBreakpoints | number;
  ref: React.RefObject<HTMLElement | null>;
  reverse?: boolean;
  useHeight?: boolean;
  forceUpdates?: boolean;
}) {
  const [isBreakpoint, setIsBreakpoint] = React.useState<boolean | undefined>(
    undefined,
  );
  const [update, setUpdate] = React.useState(0);

  useEffect(() => {
    if (!ref?.current) return;

    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );

    const px =
      (typeof breakpoint == "number"
        ? breakpoint
        : tailwindContainerBreakpoints[breakpoint]) * rootFontSize;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      const height = entry?.contentRect.height ?? 0;
      const value = useHeight ? height : width;
      setIsBreakpoint(reverse ? value < px : value >= px);
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [update, ref, breakpoint, reverse, useHeight]);

  useEffect(() => {
    const onupdate = () => {
      if (!forceUpdates) return;
      setUpdate(Math.random());
    };

    window.addEventListener("resize", onupdate);

    return () => {
      window.removeEventListener("resize", onupdate);
    };
  }, [forceUpdates]);

  return !!isBreakpoint;
}
