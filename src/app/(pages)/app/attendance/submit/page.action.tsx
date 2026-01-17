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

import { type getMembers, getEvents, getEventSubmissions } from "@/server/api";
import { db } from "@/server/db";
import { eventSubmissions } from "@/server/db/schema";
import { revalidateTag } from "next/cache";

export type Members = Awaited<ReturnType<typeof getMembers>>;
export type Events = Awaited<ReturnType<typeof getEvents>>;
export type SafeEvents = Omit<Awaited<Events[number]>, "verificationCode">[];
export type Submissions = Awaited<ReturnType<typeof getEventSubmissions>>;

export async function verifyCode({ id, code }: { id: string; code: string }) {
  const events = await getEvents();

  return events.some(
    (event) =>
      event.id == id &&
      event.verificationCode == code &&
      event.type == "attendance",
  );
}

export async function action(form: FormData) {
  const entryRequest = JSON.parse(
    String(form.get("request") as string),
  ) as Submissions[number];
  const entryCode = form.get("code") as string | null;

  const events = await getEvents();
  const submissions = await getEventSubmissions();
  const event = events.find((e) => e.id == entryRequest.eventId);

  if (entryCode == "") {
    console.error("Attendance code is empty");
    return;
  }
  if (
    entryCode &&
    !(await verifyCode({ id: entryRequest.eventId, code: entryCode }))
  ) {
    console.error("Invalid verification code");
    return;
  }

  if (!entryCode) {
    console.error("No code provided");
    return;
  }

  if (
    submissions.find(
      (s) =>
        s.eventId == entryRequest.eventId &&
        s.memberId == entryRequest.memberId,
    )
  ) {
    console.error("You have already submitted attendance for this event");
    return;
  }

  entryRequest.uploadLink = null;

  await db.insert(eventSubmissions).values({
    ...entryRequest,
    uploadLink: entryRequest.uploadLink ?? "",
    eventDate: new Date(entryRequest.eventDate ?? event?.date ?? new Date()),
    officerNotes: "",
    status: "auto-approved",
    type: "attendance",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidateTag("db:events:submissions");
}
