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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMembers, getSession } from "@/server/api";
import ResetClientPage from "./page.client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Slash } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Data",
};

const allowedTypes = ["submissions", "all"] as const;

export default async function ResetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user?.email) redirect("/auth/error?error=unauthenticated");

  const members = await getMembers(true);
  const self = members.find((m) => m.email == session.user.email);
  if (!self || !["owner", "staff"].includes(self.role ?? "")) {
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
            <span className="hidden items-center gap-2 md:flex">
              Manage <Slash className="size-3" />
            </span>{" "}
            Reset Data
          </span>
          <div className="size-12 border-2 border-transparent" />
        </div>
        <div className="mt-4 rounded-lg border p-4">
          <h2 className="text-2xl font-semibold">Reset Data</h2>
          <p className="mt-2 text-red-600">
            You are not authorized to access this page. Only Staff and Owner
            accounts can proceed with these actions.
          </p>
          <Button href="/portal/manage" className="mt-4">
            <ArrowLeft /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const params = await searchParams;

  const typeParam = Array.isArray(params?.type)
    ? params?.type[0]
    : params?.type;
  const type = allowedTypes.includes(typeParam as "submissions" | "all")
    ? (typeParam as "submissions" | "all")
    : "submissions";

  return <ResetClientPage actionType={type} />;
}
