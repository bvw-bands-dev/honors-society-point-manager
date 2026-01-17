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

"use server";

import { revalidateTag } from "next/cache";
import { db } from "@/server/db";
import { eventSubmissions, members, user } from "@/server/db/schema";
import { getEventSubmissions, getMembers, getSession } from "@/server/api";
import { and, eq, inArray, not } from "drizzle-orm";
import { getPointConfig } from "@/lib/utils";

export type Members = Awaited<ReturnType<typeof getMembers>>;
export type Submissions = Awaited<ReturnType<typeof getEventSubmissions>>;
export type PointBoost = Record<string, Record<string, number>>;

export async function action(form: FormData) {
  const session = await getSession();
  if (!session?.user?.email) {
    console.error("Not authenticated");
    return;
  }
  const self = (await getMembers(true)).find(
    (m) => m.email == session.user.email,
  );
  if (!self || !["owner", "staff", "officer"].includes(self.role ?? "")) {
    console.error("Not authorized");
    return;
  }

  const submissions = await getEventSubmissions();

  const entryMembers = JSON.parse(
    String(form.get("members") as string),
  ) as Members;
  const entryPointBoost = JSON.parse(
    String(form.get("pointBoosts") as string),
  ) as PointBoost;

  await db.transaction(async (trx) => {
    const idsInForm = new Set<string>();
    for (const data of entryMembers) {
      if (data.firstName == "" || data.lastName == "") continue;
      const id = `${data.lastName
        .trim()
        .toLowerCase()
        .replaceAll(
          " ",
          "_",
        )}.${data.firstName.trim().toLowerCase().replaceAll(" ", "_")}`;
      idsInForm.add(id);
    }

    const records = await trx
      .delete(members)
      .where(
        and(
          not(inArray(members.id, Array.from(idsInForm))),
          (() => {
            if (self.role == "owner" || self.role == "staff") {
              return not(eq(members.role, "staff"));
            } else if (self.role == "officer") {
              return and(
                not(eq(members.role, "staff")),
                not(eq(members.role, "owner")),
              );
            }
          })(),
        ),
      )
      .returning();

    for (const row of records) {
      await trx.delete(user).where(eq(user.email, row.email ?? ""));
    }

    for (const data of entryMembers) {
      if (data.firstName == "" || data.lastName == "") continue;
      const id = `${data.lastName
        .trim()
        .toLowerCase()
        .replaceAll(
          " ",
          "_",
        )}.${data.firstName.trim().toLowerCase().replaceAll(" ", "_")}`;

      delete (data as { id: unknown }).id;
      delete (data as { updatedAt: unknown }).updatedAt;
      delete (data as { createdAt: unknown }).createdAt;

      await trx
        .insert(members)
        .values({
          ...data,
          id: id,
          role: data.role == "participant" ? "participant" : "member",
          roleName: "Member",
          email: "",
        })
        .onConflictDoUpdate({
          target: members.id,
          set: {
            ...data,
            role: (() => {
              if (data.role == "participant") return "participant";
              if (data.role == "member") return "member";
              return members.role;
            })(),
            roleName: members.roleName,
            email: members.email,
            updatedAt: new Date(),
          },
        });
    }
  });

  await db.transaction(async (trx) => {
    for (const [member, values] of Object.entries(entryPointBoost)) {
      for (const [type, value] of Object.entries(values)) {
        const currentBoosts = submissions.filter(
          (s) =>
            s.eventId == "<point_boost>" &&
            s.memberId == member &&
            s.type == type,
        ).length;

        const safeType = getPointConfig().find((c) => c.id == type)
          ? type
          : "other";
        const safeValue = Math.max(0, Math.min(5, value));
        if (currentBoosts < safeValue) {
          await trx.insert(eventSubmissions).values({
            id: crypto.randomUUID(),
            memberId: member,
            eventId: "<point_boost>",
            type: safeType,
            createdAt: new Date(),
            updatedAt: new Date(),
            description: "",
            eventDate: new Date(),
            officerNotes: `<added by ${self.id}>`,
            status: "auto-approved",
            uploadLink: "",
          });
        } else if (currentBoosts > safeValue) {
          const toDelete = submissions
            .filter(
              (s) =>
                s.eventId == "<point_boost>" &&
                s.memberId == member &&
                s.type == type,
            )
            .slice(0, Math.min(currentBoosts - safeValue, currentBoosts));

          for (const del of toDelete) {
            await trx
              .delete(eventSubmissions)
              .where(eq(eventSubmissions.id, del.id));
          }
        } else {
          // do nothing
        }
      }
    }
  });

  revalidateTag("db:members");
}
