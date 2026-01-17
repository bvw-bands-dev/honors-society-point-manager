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

import { unstable_cache } from "next/cache";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const response = await unstable_cache(
    async () => {
      const s3Client = new S3Client({
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
      });

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: (await params).file,
      });

      const s3Response = await s3Client.send(command);

      if (!s3Response.Body) {
        return new Response("File not found", { status: 404 });
      }

      // Collect buffer once
      const chunks: Uint8Array[] = [];
      for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const inputBuffer = Buffer.concat(chunks);

      let pngBuffer: Buffer;

      if (
        s3Response.ContentType == "image/heic" ||
        s3Response.ContentType == "image/heif"
      ) {
        // Convert HEIC/HEIF with heic-convert
        const heicConvert = (await import("heic-convert")).default;
        pngBuffer = Buffer.from(
          await heicConvert({
            buffer: inputBuffer as unknown as ArrayBufferLike,
            format: "PNG",
            quality: 1,
          }),
        );
      } else if (s3Response.ContentType == "image/png") {
        pngBuffer = await sharp(inputBuffer, {
          autoOrient: true,
        })
          .png()
          .toBuffer();
      } else {
        pngBuffer = inputBuffer;
      }

      return new Response(Buffer.from(pngBuffer), {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": "image/png",
          "Content-Length": pngBuffer.length.toString(),
        },
      });
    },
    [(await params).file],
    {
      revalidate: 31536000,
      tags: ["db:events:submissions"],
    },
  )();

  return response;
}
