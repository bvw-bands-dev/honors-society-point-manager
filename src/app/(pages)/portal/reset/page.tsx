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
    redirect("/portal");
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
