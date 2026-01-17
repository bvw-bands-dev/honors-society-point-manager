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
import { members, user } from "@/server/db/schema";
import { getMembers, getSession } from "@/server/api";
import { and, eq, inArray, not } from "drizzle-orm";

export type Members = Awaited<ReturnType<typeof getMembers>>;

export async function action(form: FormData) {
  const session = await getSession();
  if (!session?.user?.email) {
    console.error("Not authenticated");
    return;
  }
  const memberList = await getMembers(true);
  const emails = new Set();
  const self = memberList.find((m) => m.email == session.user.email);
  if (!self || !["owner", "staff", "officer"].includes(self.role ?? "")) {
    console.error("Not authorized");
    return;
  }

  await db.transaction(async (trx) => {
    const idsInForm = new Set<string>();
    for (const data of JSON.parse(
      String(form.get("officers") as string),
    ) as Members) {
      const generatedId = `staff_${data.email?.split("@")[0]}`;
      const idToUse =
        !data.id.startsWith("staff_") && memberList.find((m) => m.id == data.id)
          ? data.id
          : generatedId;
      if (idsInForm.has(idToUse)) {
        console.error(
          `Duplicate entry for ${data.firstName} ${data.lastName} with ID ${idToUse}.`,
        );
        return;
      }
      idsInForm.add(idToUse);
      if (emails.has(data.email) && data.email != "") {
        console.error(`Email ${data.email} is already used by another member.`);
        return;
      }
      if (data.email) {
        emails.add(data.email);
      }
    }

    if (self.role == "owner" || self.role == "staff") {
      const records = await trx
        .delete(members)
        .where(
          and(
            not(inArray(members.id, Array.from(idsInForm))),
            eq(members.role, "staff"),
          ),
        )
        .returning();

      for (const row of records) {
        await trx.delete(user).where(eq(user.email, row.email ?? ""));
      }
    }

    await trx
      .update(members)
      .set({
        email: "",
        role: "member",
        roleName: "Member",
        updatedAt: new Date(),
      })
      .where(
        and(
          not(inArray(members.id, Array.from(idsInForm))),
          (() => {
            if (self.role == "owner") {
              return undefined;
            } else if (self.role == "staff") {
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

    for (const member of memberList.filter(
      (m) => m.role == "staff" || m.role == "officer",
    )) {
      if (emails.has(member.email)) continue;
      await trx.delete(user).where(eq(user.email, member.email ?? ""));
    }

    for (const data of JSON.parse(
      String(form.get("officers") as string),
    ) as Members) {
      if (data.id == "" || data.roleName == "") continue;

      delete (data as { updatedAt: unknown }).updatedAt;
      delete (data as { createdAt: unknown }).createdAt;

      const generatedId = `staff_${data.email?.split("@")[0]}`;

      if (
        memberList.find((m) => m.id == data.id) ||
        memberList.find((m) => m.id == generatedId)
      ) {
        const idToUse =
          !data.id.startsWith("staff_") &&
          memberList.find((m) => m.id == data.id)
            ? data.id
            : generatedId;

        const oldMember = memberList.find((m) => m.id == idToUse)!;

        const isSuperUser = self.role == "owner" || self.role == "staff";
        const cannotEdit = oldMember.role == "staff" && !isSuperUser;

        await trx
          .update(members)
          .set({
            role: (() => {
              if (cannotEdit) return oldMember.role;
              if (data.roleName == "Staff") {
                if (isSuperUser) {
                  return "staff";
                } else {
                  return "officer";
                }
              }
              return "officer";
            })(),
            roleName: (() => {
              if (cannotEdit) return oldMember.roleName;
              if (data.roleName == "Staff") {
                if (isSuperUser) {
                  return "Staff";
                } else {
                  return "Officer";
                }
              }
              return data.roleName;
            })(),
            email: (cannotEdit ? oldMember : data).email,
            updatedAt: new Date(),
          })
          .where(eq(members.id, idToUse));
      } else {
        const isSuperUser = self.role == "owner" || self.role == "staff";
        await trx
          .insert(members)
          .values({
            id: generatedId,
            firstName: data.id,
            lastName: "",
            role: (() => {
              if (data.roleName == "Staff" && isSuperUser) {
                return "staff";
              } else {
                return "officer";
              }
            })(),
            roleName: (() => {
              if (data.roleName == "Staff" && !isSuperUser) {
                return "Officer";
              } else {
                return data.roleName;
              }
            })(),
            email: data.email,
          })
          .onConflictDoNothing();
      }
    }
  });

  revalidateTag("db:members");
  revalidateTag("db:officers");
}
