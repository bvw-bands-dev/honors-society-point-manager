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

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Slash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { action } from "./page.action";
import { useFormStatus } from "react-dom";

const HOLD_DURATION_MS = 5000;

export default function ResetClientPage({
  actionType,
}: {
  actionType: "submissions" | "all";
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!holding) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setElapsedMs(elapsed);
      if (elapsed >= HOLD_DURATION_MS) {
        clearInterval(interval);
        setHolding(false);
        setElapsedMs(HOLD_DURATION_MS);
        formRef.current?.requestSubmit();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [holding]);

  const reset = () => {
    setHolding(false);
    setElapsedMs(0);
  };

  const label = actionType == "all" ? "Reset Everything" : "Remove Submissions";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 pb-6">
      <input type="hidden" name="type" value={actionType} />
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/portal/manage"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">
          <span className="hidden items-center gap-2 md:flex">
            Officer Portal <Slash className="size-3" />
          </span>{" "}
          Reset
        </span>
        <div className="size-12" />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-2xl font-semibold">{label}</h2>
        <p className="text-muted-foreground text-sm">
          This action is restricted to owner and staff accounts only.
        </p>
        <p className="text-muted-foreground text-sm">
          Hold the button for 5 seconds to confirm.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <HoldToConfirmButton
            holding={holding}
            progress={Math.min(elapsedMs / HOLD_DURATION_MS, 1)}
            onHoldStart={() => setHolding(true)}
            onHoldEnd={reset}
          />
          <p className="text-muted-foreground text-xs">
            {holding
              ? `Keep holding... ${Math.max(
                  0,
                  Math.ceil((HOLD_DURATION_MS - elapsedMs) / 1000),
                )}s`
              : "Hold to confirm"}
          </p>
        </div>
      </div>
    </form>
  );
}

function HoldToConfirmButton({
  holding,
  progress,
  onHoldStart,
  onHoldEnd,
}: {
  holding: boolean;
  progress: number;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="button"
      variant="destructive"
      className="relative overflow-hidden"
      onPointerDown={(event) => {
        event.preventDefault();
        if (!pending) onHoldStart();
      }}
      onPointerUp={onHoldEnd}
      onPointerLeave={onHoldEnd}
      disabled={pending}
    >
      <span
        className="absolute inset-0 -z-10 bg-white/20 transition-all"
        style={{ width: `${Math.floor(progress * 100)}%` }}
      />
      {pending
        ? "Processing..."
        : holding
          ? "Hold to Confirm"
          : "Hold to Confirm"}
    </Button>
  );
}
