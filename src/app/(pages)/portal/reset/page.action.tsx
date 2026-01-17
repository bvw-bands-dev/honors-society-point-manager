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
import { eq, inArray, not } from "drizzle-orm";
import { db } from "@/server/db";
import { eventSubmissions, events, members, user } from "@/server/db/schema";
import { getMembers, getSession } from "@/server/api";

export async function action(form: FormData) {
  const session = await getSession();
  if (!session?.user?.email) {
    console.error("Not authenticated");
    return;
  }

  const memberList = await getMembers(true);
  const self = memberList.find((m) => m.email == session.user.email);
  if (!self || !["owner", "staff"].includes(self.role ?? "")) {
    console.error("Not authorized");
    return;
  }

  const typeValue = form.get("type");
  if (typeof typeValue != "string") {
    console.error("Invalid reset type");
    return;
  }
  const type = typeValue;
  if (type != "submissions" && type != "all") {
    console.error("Invalid reset type");
    return;
  }

  await db.transaction(async (trx) => {
    await trx.delete(eventSubmissions);

    if (type == "all") {
      await trx.delete(events);

      const removedMembers = await trx
        .delete(members)
        .where(not(inArray(members.role, ["owner", "staff"])))
        .returning();

      for (const row of removedMembers) {
        if (!row.email) continue;
        await trx.delete(user).where(eq(user.email, row.email));
      }
    }
  });

  revalidateTag("db:events");
  revalidateTag("db:events:submissions");
  revalidateTag("db:members");
}
