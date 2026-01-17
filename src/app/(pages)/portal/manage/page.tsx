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
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  ShieldUser,
  Slash,
  Trash,
} from "lucide-react";

export default async function InfoPage() {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/portal"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">
          <span className="hidden items-center gap-2 md:flex">
            Officer Portal <Slash className="size-3" />
          </span>{" "}
          Manage
        </span>
        <div className="size-12 border-2 border-transparent" />
      </div>
      <div className="mt-4 flex flex-col gap-4 rounded-lg border p-4">
        <h2 className="text-4xl font-black">Honors Society Point Manager</h2>
        <h2 className="text-2xl font-semibold">Application Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              icon: ShieldUser,
              label: "Change Officers",
              href: "/portal/officers",
            },
            {
              icon: Printer,
              label: "Save Data",
              href: "/portal/data",
            },
            {
              icon: Trash,
              label: "Remove All Submissions",
              href: "/portal/reset?type=submissions",
            },
            {
              icon: RotateCcw,
              label: "Reset Everything",
              href: "/portal/reset?type=all",
            },
          ].map((item) => (
            <Button
              key={item.label}
              variant="secondary"
              href={item.href}
              className="group bg-secondary/50 hover:bg-secondary relative isolate flex h-auto flex-col items-start justify-end gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32"
            >
              <item.icon className="stroke-secondary group-hover:stroke-primary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3 transition-all group-hover:opacity-30" />
              <item.icon className="size-10 stroke-1" />
              <div className="text-lg">{item.label}</div>
            </Button>
          ))}
        </div>
        <h2 className="text-2xl font-semibold">Application Information</h2>
        <p>
          This application is designed to help manage the honors society points
          for students. It provides a user-friendly interface for tracking
          points, viewing achievements, and managing user profiles.
        </p>
        <h2 className="text-lg font-semibold">Application Attribution</h2>
        <p>
          Application created by Drake Semchyshyn, a software developer
          passionate about building tools for educational institutions. The
          application is open-source!
        </p>
      </div>
    </div>
  );
}
