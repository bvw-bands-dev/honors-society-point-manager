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

import {
  getMembers,
  getEvents,
  getEventSubmissions,
  getOfficers,
  getSession,
} from "@/server/api";
import EventsClientPage from "./page.client";
import type { Metadata } from "next";
import { getPointConfig } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manage Events",
};

export default async function EventsPage() {
  const members = await getMembers();
  const officers = await getOfficers(true);
  const session = await getSession();
  const events = await getEvents();
  const submissions = await getEventSubmissions();

  return (
    <EventsClientPage
      members={members}
      self={officers.find((o) => o.email == session!.user.email)!}
      events={events.filter(
        (e) => getPointConfig().find((c) => c.id == e.type) != undefined,
      )}
      submissions={submissions}
      BASE_URL={process.env.BASE_URL ?? ""}
    />
  );
}
