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

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { APIError } from "better-auth/api";
import { getOfficers } from "@/server/api";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
  baseURL: process.env.BASE_URL ?? "",
  trustedOrigins: [process.env.BASE_URL ?? ""],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const officers = await getOfficers(true);

          const officer = officers.find((o) => o.email == user.email);

          if (!officer) {
            throw new APIError("UNAUTHORIZED", {
              code: "not_officer",
              message: "not_officer",
            });
          }
          return {
            data: {
              ...user,
              name: `${officer.firstName} ${officer.lastName}`,
            },
          };
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});
