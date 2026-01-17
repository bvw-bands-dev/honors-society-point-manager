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

"use client";

import { cn } from "@/lib/utils";
import QrScannerLibrary from "qr-scanner";
import { useEffect, useRef } from "react";

export function QrScanner({
  className,
  onResult,
}: {
  className?: string;
  onResult?: (value: QrScannerLibrary.ScanResult) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const qrScanner = new QrScannerLibrary(
      videoRef.current,
      (result) => {
        onResult?.(result);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    );

    const debounse = setTimeout(() => {
      qrScanner.start().catch(console.error);
    }, 100);
    return () => {
      clearTimeout(debounse);
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [onResult]);

  return (
    <video
      ref={videoRef}
      className={cn("h-full w-full bg-black object-cover", className)}
    />
  );
}
