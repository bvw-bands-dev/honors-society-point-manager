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

import { getEvents, getMembers } from "@/server/api";
import { EventSubmissionClientPage } from "./page.client";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Attendance",
};

export default async function EventSubmissionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const cookieList = await cookies();
  const members = await getMembers();
  const events = await getEvents();
  const memberId = cookieList.get("selectedMember")?.value;

  const safeEvents = events.map((event) => ({
    ...event,
    verificationCode: undefined,
  }));

  return (
    <EventSubmissionClientPage
      searchParams={await searchParams}
      members={members}
      events={safeEvents}
      memberId={memberId}
    />
  );
}
