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

import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/ui/qr-scanner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function AttendanceStartSubmissionClientPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const qrReader = useMemo(
    () => (
      <QrScanner
        className="size-32 rounded-lg"
        onResult={(val) => {
          if (loading) return;
          setLoading(true);
          const url = new URL("/app/events/submit", window.location.origin);
          const scannedUrl = new URL(val.data);
          scannedUrl.searchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
          });
          router.push(url.toString());
        }}
      />
    ),
    [loading, router],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/app"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">Event Submission</span>
        <div />
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row">
          <div className="grid size-32 shrink-0 place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
            {qrReader}
            <div
              className={cn(
                "bg-secondary z-10 grid h-full w-full place-items-center rounded-lg opacity-0",
                loading && "opacity-100",
              )}
            >
              <Loader className="animate-spin" />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2">
            <h2 className="font-bold">Enter Event Code or Scan QR</h2>
            <p className="text-muted-foreground text-xs">
              If you have a QR code, scan it with your camera or proceed
              manually. manually.
            </p>
            <Button
              href="/app/events/submit"
              variant="link"
              className="text-foreground mt-auto justify-start px-0"
            >
              Enter Event Manually
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
