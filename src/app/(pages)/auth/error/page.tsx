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

import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { OfficerButton } from "./page.client";
import { House } from "lucide-react";

export const metadata: Metadata = {
  title: `Auth Error | ${process.env.APPLICATION_NAME ?? "Honors Society Point Manager"}`,
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  return (
    <div className="relative mx-auto flex h-screen w-full max-w-[100ch] flex-col items-start justify-end gap-2 p-8">
      {await (async () => {
        switch ((await searchParams).error) {
          default:
            return (
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">
                  Something ... went wrong :/
                </h1>
                <p className="text-muted-foreground">
                  Hmm, something isn{"'"}t right, maybe try again?
                </p>
              </div>
            );
          case "invalid_code":
            return (
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Invalid Code</h1>
                <p className="text-muted-foreground">
                  Hmm, something isn{"'"}t right, maybe try again?
                </p>
              </div>
            );
          case "not_officer":
            return (
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Not an Officer</h1>
                <p className="text-muted-foreground">
                  You must be an officer to access this page.
                </p>
              </div>
            );
        }
      })()}
      <div className="flex items-center gap-2">
        <Button href="/">
          <House /> Home
        </Button>
        <OfficerButton />
      </div>
    </div>
  );
}
