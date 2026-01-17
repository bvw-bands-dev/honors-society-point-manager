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

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { tailwindColors } from "../app/pick-theme";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPointConfig(): {
  id: string;
  name: string;
  icon: string;
  Icon: React.JSXElementConstructor<React.SVGProps<SVGSVGElement>>;
  minimumPoints: number;
  color: keyof typeof tailwindColors;
}[] {
  const config = JSON.parse(
    process.env.NEXT_PUBLIC_POINT_TYPES ?? "[]",
  ) as Record<string, string>[];
  for (const item of config) {
    if (!item.icon || !item.name || !item.id) {
      throw new Error("Invalid point type configuration");
    }
    try {
      // Dynamically import the icon from lucide-react
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
      const { [item.icon]: Icon } = require("lucide-react");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      item.Icon = Icon;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      throw new Error(`Invalid icon name: ${item.icon}`);
    }
    if (typeof item.minimumPoints != "number" || item.minimumPoints < 0) {
      item.minimumPoints = 0 as unknown as string;
    }
    if (!item.color || !(item.color in tailwindColors)) {
      item.color = "neutral";
    }
  }
  return config as unknown as {
    id: string;
    name: string;
    icon: string;
    Icon: React.JSXElementConstructor<React.SVGProps<SVGSVGElement>>;
    minimumPoints: number;
    color: keyof typeof tailwindColors;
  }[];
}
