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
import { getOfficers, getRole, getRoleName, getSession } from "@/server/api";
import {
  ArrowLeft,
  Calendar,
  CheckCheck,
  Dot,
  ListChecks,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { SignOutButton } from "./layout.client";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Officer Portal",
};

export default async function PortalPage() {
  const officers = await getOfficers(true);
  const session = await getSession();

  return (
    <div className="relative flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">Officer Portal</span>
        <SignOutButton />
      </div>
      <div className="bg-secondary/50 relative isolate flex h-auto flex-col items-start justify-end gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32 font-medium">
        <UserRound className="stroke-secondary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3" />
        <UserRound className="size-10 stroke-1" />
        <div className="flex flex-col gap-1">
          <span>
            Hello,{" "}
            {officers.find((o) => o.email == session!.user.email)?.firstName}!
          </span>
          <span className="flex items-center text-xs">
            {(await getRole(session!.user.email)) ==
            (await getRoleName(session!.user.email)) ? (
              <>{await getRole(session!.user.email)}</>
            ) : (
              <>
                {await getRole(session!.user.email)}
                <Dot className="size-3" />{" "}
                {await getRoleName(session!.user.email)}
              </>
            )}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            icon: Calendar,
            label: "Manage Events",
            href: "/portal/events",
          },
          {
            icon: ListChecks,
            label: "Manage Attendance",
            href: "/portal/attendance",
          },
          {
            icon: CheckCheck,
            label: "Manage Submissions",
            href: "/portal/submissions",
          },
          {
            icon: UsersRound,
            label: "Manage Members",
            href: "/portal/members",
          },
          {
            icon: Wrench,
            label: "Manage Application",
            href: "/portal/manage",
            span: true,
          },
        ].map((item) => (
          <Button
            key={item.label}
            variant="secondary"
            href={item.href}
            className={
              cn(
                "group bg-secondary/50 hover:bg-secondary relative isolate flex h-auto flex-col items-start justify-end gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32",
              ) + (item.span ? ` md:col-span-2` : "")
            }
          >
            <item.icon className="stroke-secondary group-hover:stroke-primary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3 transition-all group-hover:opacity-30" />
            <item.icon className="size-10 stroke-1" />
            <div className="text-lg">{item.label}</div>
          </Button>
        ))}
      </div>
    </div>
  );
}
