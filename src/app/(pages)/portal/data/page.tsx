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

import type { Metadata } from "next";
import {
  getAttendanceSubmissions,
  getEventSubmissions,
  getEvents,
  getMembers,
  getSession,
} from "@/server/api";
import { getPointConfig } from "@/lib/utils";
import { tailwindColors } from "@/app/pick-theme";

export const metadata: Metadata = {
  title: "Portal Data",
};

const statusClasses: Record<string, string> = {
  approved: "text-green-700",
  "auto-approved": "text-green-700",
  pending: "text-yellow-700",
  rejected: "text-red-700",
  cancelled: "text-red-700",
  absent: "text-slate-600",
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value)?.toLocaleDateString?.(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatName(firstName: string, lastName: string) {
  return `${lastName}, ${firstName}`.replace(/^,\s*/, "");
}

export default async function PortalPrintPage() {
  const session = await getSession();
  const members = await getMembers();
  const events = await getEvents();
  const submissions = await getEventSubmissions();
  const attendanceSubmissions = await getAttendanceSubmissions();
  const pointConfig = getPointConfig();

  const attendanceEvents = events
    .filter((event) => event.type == "attendance")
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  const nonAttendanceEvents = events.filter(
    (event) => event.type != "attendance",
  );

  const attendanceByEventMember = new Map<string, string>();
  for (const submission of attendanceSubmissions) {
    attendanceByEventMember.set(
      `${submission.eventId}:${submission.memberId}`,
      submission.status ?? "pending",
    );
  }

  const memberNameById = new Map(
    members.map((member) => [
      member.id,
      formatName(member.firstName, member.lastName),
    ]),
  );

  const pointTotalsByMember = new Map<
    string,
    Record<string, { total: number; pending: number }>
  >();

  for (const member of members) {
    const totals: Record<string, { total: number; pending: number }> = {};
    for (const config of pointConfig) {
      const approvedCount = submissions.filter(
        (submission) =>
          submission.memberId == member.id &&
          submission.type == config.id &&
          submission.eventId != "<point_boost>" &&
          (submission.status == "approved" ||
            submission.status == "auto-approved"),
      ).length;
      const boostCount = submissions.filter(
        (submission) =>
          submission.memberId == member.id &&
          submission.type == config.id &&
          submission.eventId == "<point_boost>",
      ).length;
      const pendingCount = submissions.filter(
        (submission) =>
          submission.memberId == member.id &&
          submission.type == config.id &&
          submission.status == "pending",
      ).length;
      totals[config.id] = {
        total: approvedCount + boostCount,
        pending: pendingCount,
      };
    }
    pointTotalsByMember.set(member.id, totals);
  }

  return (
    <div
      className="-m-8 flex flex-col gap-10 bg-white pb-10 text-sm text-black"
      data-print
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Portal Data Report</h1>
        <p className="text-muted-foreground">
          Generated for {session?.user?.email ?? "unknown user"} on{" "}
          {new Date().toLocaleString()}.
        </p>
        <p className="text-muted-foreground print:hidden">
          Use your browser&apos;s print dialog to save or print this report.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
          <span className="text-muted-foreground text-xs">
            {nonAttendanceEvents.length} events
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(() => {
            const totals = {
              approved: submissions.filter(
                (s) => s.status == "approved" || s.status == "auto-approved",
              ).length,
              pending: submissions.filter((s) => s.status == "pending").length,
              rejected: submissions.filter(
                (s) => s.status == "rejected" || s.status == "cancelled",
              ).length,
            };

            return (
              <>
                <span
                  className={`rounded-full border px-3 py-1 ${statusClasses.approved}`}
                >
                  Approved: {totals.approved}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 ${statusClasses.pending}`}
                >
                  Pending: {totals.pending}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 ${statusClasses.rejected}`}
                >
                  Rejected: {totals.rejected}
                </span>
              </>
            );
          })()}
        </div>
        <div className="flex flex-col gap-4">
          {nonAttendanceEvents.map((event) => {
            const eventConfig = pointConfig.find((c) => c.id == event.type);
            const eventSubmissions = submissions.filter(
              (submission) => submission.eventId == event.id,
            );
            const submissionsByStatus = {
              approved: eventSubmissions.filter(
                (s) => s.status == "approved" || s.status == "auto-approved",
              ),
              pending: eventSubmissions.filter((s) => s.status == "pending"),
              rejected: eventSubmissions.filter(
                (s) => s.status == "rejected" || s.status == "cancelled",
              ),
            };
            const counts = {
              approved: submissionsByStatus.approved.length,
              pending: submissionsByStatus.pending.length,
              rejected: submissionsByStatus.rejected.length,
            };

            return (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-lg p-4 print:break-after-page"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-base font-medium">
                      {event.name || "Untitled Event"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(event.date)}
                      {event.location ? ` · ${event.location}` : ""}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      color: eventConfig?.color
                        ? tailwindColors[eventConfig.color]
                        : tailwindColors.neutral,
                    }}
                  >
                    {eventConfig?.name ?? event.type}
                  </span>
                </div>
                {event.notes && (
                  <p className="text-muted-foreground text-xs">{event.notes}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full border px-3 py-1 ${statusClasses.approved}`}
                  >
                    Approved: {counts.approved}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 ${statusClasses.pending}`}
                  >
                    Pending: {counts.pending}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 ${statusClasses.rejected}`}
                  >
                    Rejected: {counts.rejected}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                  {(
                    [
                      ["Approved", submissionsByStatus.approved],
                      ["Pending", submissionsByStatus.pending],
                      ["Rejected", submissionsByStatus.rejected],
                    ] as const
                  ).map(([label, entries]) => (
                    <div
                      key={`${event.id}-${label}`}
                      className="flex flex-col gap-2 rounded-md p-3"
                    >
                      <span className="text-muted-foreground text-[11px] uppercase">
                        {label}
                      </span>
                      {entries.length == 0 ? (
                        <span className="text-muted-foreground">None</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {entries.map((entry) => (
                            <li key={entry.id} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  {memberNameById.get(entry.memberId) ??
                                    entry.memberId}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                    statusClasses[entry.status ?? "pending"] ??
                                    statusClasses.pending
                                  }`}
                                >
                                  {entry.status}
                                </span>
                              </div>
                              {(entry.status == "rejected" ||
                                entry.status == "cancelled") &&
                                (entry.officerNotes ?? entry.description) && (
                                  <span className="text-muted-foreground text-[11px]">
                                    Reason:{" "}
                                    {entry.officerNotes ?? entry.description}
                                  </span>
                                )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {nonAttendanceEvents.length == 0 && (
            <p className="text-muted-foreground">No events found.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attendance</h2>
          <span className="text-muted-foreground text-xs">
            {attendanceEvents.length} attendance dates
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {attendanceEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-lg p-4 print:break-after-page"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-base font-medium">
                    {formatDate(event.date)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {event.location ?? ""}
                  </span>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    color: tailwindColors.sky,
                  }}
                >
                  Attendance
                </span>
              </div>
              {(() => {
                const attendees = attendanceSubmissions.filter(
                  (submission) =>
                    submission.eventId == event.id &&
                    (submission.status == "approved" ||
                      submission.status == "auto-approved"),
                );

                if (attendees.length == 0) {
                  return (
                    <p className="text-muted-foreground text-xs">
                      No attendees recorded.
                    </p>
                  );
                }

                return (
                  <ul className="flex flex-col gap-1 text-xs">
                    {attendees.map((submission) => (
                      <li
                        key={submission.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {memberNameById.get(submission.memberId) ??
                            submission.memberId}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            statusClasses[submission.status ?? "approved"] ??
                            statusClasses.approved
                          }`}
                        >
                          {submission.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          ))}
          {attendanceEvents.length == 0 && (
            <p className="text-muted-foreground">No attendance events found.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members &amp; Points</h2>
          <span className="text-muted-foreground text-xs">
            {members.length} members
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {members.map((member) => {
            const totals = pointTotalsByMember.get(member.id) ?? {};
            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-lg p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-medium">
                    {formatName(member.firstName, member.lastName)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {member.roleName}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {pointConfig.map((config) => {
                    const entry = totals[config.id] ?? {
                      total: 0,
                      pending: 0,
                    };
                    const statusClass =
                      entry.total == 0
                        ? "text-red-700"
                        : entry.total >= config.minimumPoints
                          ? "text-green-700"
                          : "text-yellow-700";
                    return (
                      <span
                        key={`${member.id}-${config.id}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${statusClass}`}
                      >
                        <span>{config.name}</span>
                        <span>
                          {entry.total}/{config.minimumPoints}
                        </span>
                        {entry.pending > 0 && (
                          <span className="text-[10px] uppercase">
                            ({entry.pending} pending)
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {members.length == 0 && (
            <p className="text-muted-foreground">No members found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
