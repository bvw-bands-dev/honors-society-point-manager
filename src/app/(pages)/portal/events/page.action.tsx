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
import { events, eventSubmissions, members } from "@/server/db/schema";
import {
  type getEvents,
  getEventSubmissions,
  getMembers,
  getSession,
} from "@/server/api";
import { and, eq, inArray, not, or } from "drizzle-orm";
import { getPointConfig } from "@/lib/utils";

export type Members = Awaited<ReturnType<typeof getMembers>>;
export type Events = Awaited<ReturnType<typeof getEvents>>;
export type Submissions = Awaited<ReturnType<typeof getEventSubmissions>>;

export async function action(form: FormData) {
  const session = await getSession();
  const submissions = await getEventSubmissions();
  if (!session?.user?.email) {
    console.error("Not authenticated");
    return;
  }
  const memberList = await getMembers(true);
  const self = memberList.find((m) => m.email == session.user.email);
  if (!self || !["owner", "staff", "officer"].includes(self.role ?? "")) {
    console.error("Not authorized");
    return;
  }

  const entryEvents = JSON.parse(
    String(form.get("events") as string),
  ) as Events;
  const entryMembers = JSON.parse(
    String(form.get("members") as string),
  ) as Members;
  let entrySubmissions = JSON.parse(
    String(form.get("submissions") as string),
  ) as Submissions;

  await db.transaction(async (trx) => {
    const idsInForm = new Set<string>();
    const addedMembers = new Set<string>();
    const newSubmissions = new Set<string>();

    for (const data of entryEvents) {
      if (data.name == "") continue;
      const id = data.name.trim().toLowerCase().replaceAll(" ", "_");
      idsInForm.add(id);
    }

    for (const data of entryMembers) {
      const id = `${data.lastName
        .trim()
        .toLowerCase()
        .replaceAll(
          " ",
          "_",
        )}.${data.firstName.trim().toLowerCase().replaceAll(" ", "_")}`;
      addedMembers.add(id);
    }

    for (const data of entrySubmissions) {
      newSubmissions.add(data.id);
    }

    for (const data of submissions) {
      // if (data.type == "attendance" || data.type == "service") continue;
      addedMembers.add(data.memberId);
    }

    await trx
      .delete(members)
      .where(
        and(
          eq(members.role, "participant"),
          not(inArray(members.id, Array.from(addedMembers))),
        ),
      );

    await trx.delete(events).where(
      and(
        not(inArray(events.id, Array.from(idsInForm))),
        or(
          inArray(
            events.type,
            getPointConfig().map((c) => c.id),
          ),
        ),
      ),
    );

    await trx.delete(eventSubmissions).where(
      and(
        not(inArray(eventSubmissions.id, Array.from(newSubmissions))),
        or(
          inArray(
            eventSubmissions.type,
            getPointConfig().map((c) => c.id),
          ),
        ),
        inArray(eventSubmissions.eventId, Array.from(idsInForm)),
      ),
    );

    for (const data of entryMembers) {
      if (data.firstName == "" || data.lastName == "") continue;
      const id = `${data.lastName
        .trim()
        .toLowerCase()
        .replaceAll(
          " ",
          "_",
        )}.${data.firstName.trim().toLowerCase().replaceAll(" ", "_")}`;

      delete (data as { updatedAt?: unknown }).updatedAt;
      delete (data as { createdAt?: unknown }).createdAt;

      entrySubmissions = entrySubmissions.map((s) => {
        if (s.memberId == data.id) {
          return {
            ...s,
            memberId: id,
          };
        }
        return s;
      });

      delete (data as { id?: unknown }).id;

      await trx
        .insert(members)
        .values({
          ...data,
          id: id,
          role: "participant",
          roleName: "Participant",
          email: "",
        })
        .onConflictDoNothing();
    }

    for (const data of entryEvents) {
      if (data.id == "" || data.name == "") continue;
      const id = data.name.trim().toLowerCase().replaceAll(" ", "_");

      delete (data as { id?: unknown }).id;
      delete (data as { updatedAt?: unknown }).updatedAt;
      delete (data as { createdAt?: unknown }).createdAt;

      await trx
        .insert(events)
        .values({
          ...data,
          id: id,
          date: data.date ? new Date(data.date) : null,
          type: getPointConfig().find((c) => c.id == data.type)
            ? data.type
            : "other",
        })
        .onConflictDoUpdate({
          target: events.id,
          set: {
            ...data,
            id: id,
            date: data.date ? new Date(data.date) : null,
            type: getPointConfig().find((c) => c.id == data.type)
              ? data.type
              : "other",
            updatedAt: new Date(),
          },
        });
    }
  });

  await db.transaction(async (trx) => {
    for (const data of entrySubmissions) {
      if (data.id == "" || data.id == null) continue;

      delete (data as { updatedAt?: unknown }).updatedAt;
      delete (data as { createdAt?: unknown }).createdAt;

      await trx
        .insert(eventSubmissions)
        .values({
          ...data,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          officerNotes: (() => {
            if (
              data.status == "approved" &&
              submissions.find((s) => s.id == data.eventId)?.status !=
                data.status
            ) {
              return `<added by ${self.id}>`;
            } else {
              return submissions.find((s) => s.id == data.eventId)
                ?.officerNotes;
            }
          })(),
        })
        .onConflictDoUpdate({
          target: eventSubmissions.id,
          set: {
            ...data,
            eventDate: data.eventDate ? new Date(data.eventDate) : null,
            updatedAt: new Date(),
          },
        });
    }
  });

  revalidateTag("db:members");
  revalidateTag("db:events");
  revalidateTag("db:events:submissions");
}
