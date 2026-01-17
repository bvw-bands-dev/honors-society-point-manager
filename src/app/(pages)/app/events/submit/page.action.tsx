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
import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { eventSubmissions } from "@/server/db/schema";
import { revalidateTag } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getPointConfig } from "@/lib/utils";
import sharp from "sharp";

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
      getPointConfig().some((config) => config.id == event.type),
  );
}

export async function action(form: FormData) {
  const entryRequest = JSON.parse(
    String(form.get("request") as string),
  ) as Submissions[number];
  const entryCode = form.get("code") as string | null;
  const additionalMemberIdsRaw = form.get("additionalMemberIds") as
    | string
    | null;
  let entryFile = form.get("file") as File | null;

  const additionalMemberIds = (() => {
    if (!additionalMemberIdsRaw) return [] as string[];
    try {
      const parsed = JSON.parse(additionalMemberIdsRaw) as unknown;
      if (!Array.isArray(parsed)) return [] as string[];
      return parsed
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean);
    } catch (err) {
      console.error("Failed to parse additionalMemberIds", err);
      return [] as string[];
    }
  })();

  const participantIds = Array.from(
    new Set(
      [entryRequest.memberId, ...additionalMemberIds].filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  );

  if (((await entryFile?.bytes()) ?? 0) == 0) {
    entryFile = null;
  }

  const events = await getEvents();
  const submissions = await getEventSubmissions();
  const event = events.find((e) => e.id == entryRequest.eventId);

  if (!event?.hasQrSubmission && entryCode != "") {
    console.error("Cannot have an event code present");
    return;
  }
  if (
    entryCode &&
    !(await verifyCode({ id: entryRequest.eventId, code: entryCode }))
  ) {
    console.error("Invalid verification code");
    return;
  }
  if (!entryCode && entryFile == null) {
    console.error("No file or code provided");
    return;
  }
  if (
    entryCode &&
    submissions.find(
      (s) =>
        s.eventId == entryRequest.eventId &&
        participantIds.includes(s.memberId),
    )
  ) {
    console.error("You have already submitted attendance for this event");
    return;
  }

  let uploadLink: string | null = null;

  if (entryFile) {
    if (entryFile.size > 15 * 1024 * 1024) {
      console.error(
        "File size exceeds 15MB limit",
        "\nProvided size: ",
        entryFile.size / (1024 * 1024) + "MB",
      );
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

    const fileId = `${randomUUID()}.png`;

    try {
      // Load file into memory
      const fileBuffer = Buffer.from(await entryFile.arrayBuffer());

      let pngBuffer: Buffer;

      if (entryFile.type === "image/heic" || entryFile.type === "image/heif") {
        // Convert HEIC/HEIF -> PNG
        const heicConvert = (await import("heic-convert")).default;

        pngBuffer = Buffer.from(
          await heicConvert({
            buffer: fileBuffer as unknown as ArrayBufferLike,
            format: "PNG",
            quality: 1,
          }),
        );
      } else {
        // Use sharp for all other images -> PNG
        pngBuffer = await sharp(fileBuffer, { animated: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
      }

      // Upload PNG only
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: fileId,
          Body: pngBuffer,
          ContentType: "image/png",
          ContentLength: pngBuffer.length,
        }),
      );

      uploadLink = fileId;
    } catch (error) {
      console.error("S3 upload failed:", error);
      throw new Error("File upload failed");
    }
  } else {
    uploadLink = null;
  }

  const now = new Date();
  const eventDate = new Date(entryRequest.eventDate ?? event?.date ?? now);
  const status: Submissions[number]["status"] =
    entryCode == "" ? "pending" : "auto-approved";

  const rows = participantIds.map((memberId, idx) => ({
    ...entryRequest,
    id: idx === 0 ? entryRequest.id : randomUUID(),
    memberId,
    uploadLink: uploadLink ?? "",
    eventDate,
    officerNotes: "",
    status,
    createdAt: now,
    updatedAt: now,
  }));

  await db.insert(eventSubmissions).values(rows);

  revalidateTag("db:events:submissions");
}
