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

import { z } from "zod";

const envSchema = z.object({
  // Database Config (SQLite)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_TOKEN: z.string().min(1, "DATABASE_TOKEN is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // File Storage Config (S3)
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_ENDPOINT: z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: z.string().min(1, "S3_REGION is required"),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),

  // Auth Config
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "GOOGLE_CLIENT_ID is required")
    .regex(
      /\.apps\.googleusercontent\.com$/,
      "GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com",
    ),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Debug Config (React Devtools) - Optional
  REACT_EDITOR: z.enum(["code", "subl", "atom", "webstorm", "zed"]).optional(),

  // App Configuration
  OWNER_EMAIL: z.string().email(),
  APPLICATION_NAME: z.string().optional(),
  INSTAGRAM_LINK: z
    .string()
    .url("INSTAGRAM_LINK must be a valid URL")
    .optional()
    .or(z.literal("")),
  FAVICON_IMAGE: z.string().optional().or(z.literal("")),
  BANNER_IMAGE: z.string().optional().or(z.literal("")),
  BASE_URL: z.string().url("BASE_URL must be a valid URL"),
  COLOR_THEME: z
    .enum([
      "neutral",
      "stone",
      "zinc",
      "slate",
      "gray",
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
      "rose",
    ])
    .default("red"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    console.log();
    console.log();
    if (
      error &&
      typeof error == "object" &&
      "issues" in error &&
      Array.isArray((error as any).issues)
    ) {
      const zodError = error as z.ZodError;
      console.error("❌ Environment validation failed:");
      zodError.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else if (
      error &&
      typeof error == "object" &&
      "errors" in error &&
      Array.isArray((error as any).errors)
    ) {
      const zodError = error as any;
      console.error("❌ Environment validation failed:");
      zodError.errors.forEach((err: any) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(
        "❌ Unexpected error during environment validation:",
        error,
      );
    }
    console.log();
    console.log();
    throw new Error("Invalid environment configuration");
  }
}

validateEnv();
