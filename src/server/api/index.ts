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

import { db } from "@/server/db";
import { events, eventSubmissions, members } from "@/server/db/schema";
import { not, eq, and, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function getOfficers(includeStaff = false) {
  const req = unstable_cache(
    async () => {
      return (await getMembers(includeStaff)).filter(
        (m) => m.role != "member" && m.role != "participant",
      );
    },
    [String(includeStaff)],
    { tags: ["db:members", "db:officers"] },
  );
  return await req();
}

export async function getMembers(includeStaff = false) {
  const req = unstable_cache(
    async () => {
      return (
        await db
          .select()
          .from(members)
          .where(
            includeStaff
              ? undefined
              : and(
                  not(eq(members.role, "owner")),
                  not(eq(members.role, "staff")),
                ),
          )
      ).sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );
    },
    [String(includeStaff)],
    { tags: ["db:members", "db:officers"] },
  );
  return [
    ...(await req()),
    ...(includeStaff
      ? [
          {
            id: "owner",
            firstName: "Dev Account",
            lastName: "",
            role: "owner",
            roleName: "Owner",
            email: process.env.OWNER_EMAIL,
          } as Awaited<ReturnType<typeof req>>[number],
        ]
      : []),
  ];
}

export async function getEvents() {
  const req = unstable_cache(
    async () => {
      return (await db.select().from(events)).sort(
        (a, b) =>
          (a.type ?? "").localeCompare(b.type ?? "") ||
          (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0) ||
          (a.name ?? "").localeCompare(b.name ?? ""),
      );
    },
    [],
    { tags: ["db:events"] },
  );
  return await req();
}

export async function getEventSubmissions(userId?: string, showAllData = true) {
  const req = unstable_cache(
    async () => {
      // Calculate semester start date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based (January = 0)

      let semesterStart: Date;

      // Determine current semester and its start date
      if (currentMonth >= 7) {
        // Fall semester (August - December)
        semesterStart = new Date(currentYear, 7, 1); // August 1st
      } else if (currentMonth >= 0 && currentMonth <= 4) {
        // Spring semester (January - May)
        semesterStart = new Date(currentYear, 0, 1); // January 1st
      } else {
        // Summer semester (June - July) - or you might want to include this in spring
        semesterStart = new Date(currentYear, 5, 1); // June 1st
      }

      return (
        await db
          .select()
          .from(eventSubmissions)
          .where(
            and(
              userId ? eq(eventSubmissions.memberId, userId) : undefined,
              not(eq(eventSubmissions.type, "attendance")),
              showAllData
                ? undefined
                : gte(eventSubmissions.createdAt, semesterStart),
            ),
          )
      ).sort(
        (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
      );
    },
    [String(userId), String(showAllData)],
    { tags: ["db:events", "db:events:submissions"] },
  );
  return await req();
}

export async function getAttendanceSubmissions(userId?: string) {
  const req = unstable_cache(
    async () => {
      return (
        await db
          .select()
          .from(eventSubmissions)
          .where(
            and(
              userId ? eq(eventSubmissions.memberId, userId) : undefined,
              eq(eventSubmissions.type, "attendance"),
            ),
          )
      ).sort(
        (a, b) => (a.eventDate?.getTime() ?? 0) - (b.eventDate?.getTime() ?? 0),
      );
    },
    [String(userId)],
    { tags: ["db:events", "db:events:submissions"] },
  );
  return await req();
}

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function getRole(email: string) {
  const req = unstable_cache(
    async () => {
      return (
        (await getMembers(true)).find((m) => m.email == email)?.role ??
        "Participant"
      );
    },
    [email],
    { tags: ["db:members", "db:officers", "db:role"] },
  );

  function toProperCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return toProperCase(await req());
}

export async function getRoleName(email: string) {
  const req = unstable_cache(
    async () => {
      return (
        (await getMembers(true)).find((m) => m.email == email)?.roleName ??
        "Participant"
      );
    },
    [email],
    { tags: ["db:members", "db:officers", "db:role"] },
  );
  return await req();
}
