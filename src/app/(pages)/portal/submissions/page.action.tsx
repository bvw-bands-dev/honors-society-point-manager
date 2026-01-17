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
import { eventSubmissions } from "@/server/db/schema";
import {
  type getEvents,
  getEventSubmissions,
  getMembers,
  getSession,
} from "@/server/api";
import { eq } from "drizzle-orm";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

  const s3 = new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  });

  await db.transaction(async (trx) => {
    const entrySubmissions = JSON.parse(
      String(form.get("submissions") as string),
    ) as Submissions;

    for (const data of entrySubmissions) {
      if (data.id == "" || data.id == null) continue;

      delete (data as { eventDate: unknown }).eventDate;
      delete (data as { updatedAt: unknown }).updatedAt;
      delete (data as { createdAt: unknown }).createdAt;

      const cannotChangeStatus =
        self.role == "officer" &&
        submissions.find((s) => s.id == data.id)?.status != "pending";

      await trx
        .update(eventSubmissions)
        .set({
          ...data,
          status: cannotChangeStatus ? eventSubmissions.status : data.status,
          officerNotes: (() => {
            if (cannotChangeStatus) {
              return eventSubmissions.officerNotes;
            } else if (
              data.status == "approved" &&
              submissions.find((s) => s.id == data.id)?.status != data.status
            ) {
              return `<approved by ${self.id}>`;
            } else {
              return data.officerNotes;
            }
          })(),
          updatedAt: new Date(),
          uploadLink:
            data.status == "pending" ? eventSubmissions.uploadLink : "",
        })
        .where(eq(eventSubmissions.id, data.id));

      if (
        !cannotChangeStatus &&
        submissions.find((s) => s.id == data.id)?.uploadLink &&
        data.status != "pending"
      ) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: submissions.find((s) => s.id == data.id)!.uploadLink!,
          }),
        );
      }
    }
  });

  revalidateTag("db:events:submissions");
}
