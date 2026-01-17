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
import { House, RotateCw } from "lucide-react";

export default async function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative mx-auto flex h-screen w-full max-w-[100ch] flex-col items-start justify-end gap-2 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">An error occured :/</h1>
        <p className="text-muted-foreground">
          Hmm, seems like something went wrong, maybe try going back to the home
          page?
        </p>
        <p className="text-muted-foreground">
          {error.name}: {error.message}
          <br />
          {String(error.cause)}
          <br />
          {error.stack}
          <br />
          {error.digest}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button href="/">
          <House /> Home
        </Button>
        <Button onClick={() => reset()}>
          <RotateCw /> Try Again
        </Button>
      </div>
    </div>
  );
}
