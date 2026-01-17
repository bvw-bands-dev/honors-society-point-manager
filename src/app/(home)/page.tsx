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

import Image from "next/image";
import { ContinueButton, OfficerButton } from "./page.client";
import { getMembers } from "@/server/api";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Heart, Instagram } from "lucide-react";

export const metadata: Metadata = {
  title: `Home | ${process.env.APPLICATION_NAME ?? "Honors Society Point Manager"}`,
  icons: process.env.FAVICON_IMAGE,
};

export type Members = Awaited<ReturnType<typeof getMembers>>;

export default async function Homepage() {
  const members = await getMembers();
  const cookieList = await cookies();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {process.env.BANNER_IMAGE && (
          <Image
            src={process.env.BANNER_IMAGE ?? ""}
            width={1920}
            height={1080}
            alt="Tri-M Logo"
            className="w-[70vw] max-w-[50ch] min-w-[20ch]"
          />
        )}
        <p className="text-muted-foreground xs:text-md mt-4 text-center text-xs font-semibold sm:text-xl">
          Welcome to the{" "}
          {process.env.APPLICATION_NAME ?? "Honors Society Point Manager"}!
        </p>
      </div>
      <div className="flex w-full items-end justify-between gap-2">
        <div className="flex flex-col items-start">
          <Button
            variant="link"
            href="https://www.bluefla.me/"
            className="text-muted-foreground/30 hover:text-muted-foreground/60 -mb-2 !px-2 text-xs"
            target="_blank"
          >
            <Heart />
            <span className="hidden sm:inline">
              Created with love by Drake Semchyshyn
            </span>
          </Button>
          <div className="flex items-center gap-2">
            <OfficerButton />
            {process.env.INSTAGRAM_LINK && (
              <Button
                variant="link"
                href={process.env.INSTAGRAM_LINK}
                className="text-foreground/50 !px-2"
                target="_blank"
              >
                <Instagram />
                <span className="hidden sm:inline">Instagram</span>
              </Button>
            )}
          </div>
        </div>
        <ContinueButton
          members={members}
          defaultMemberId={cookieList.get("selectedMember")?.value}
        />
      </div>
    </div>
  );
}
