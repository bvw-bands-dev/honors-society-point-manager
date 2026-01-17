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

import { getMembers, getOfficers, getSession } from "@/server/api";
import OfficersClientPage from "./page.client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Officers",
};

export default async function OfficersPage() {
  const members = await getMembers(true);
  const officers = await getOfficers(true);
  const session = await getSession();

  return (
    <OfficersClientPage
      members={members.slice(0, -1)}
      officers={officers.slice(0, -1)}
      self={officers.find((o) => o.email == session!.user.email)!}
    />
  );
}
