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

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  CircleSlash,
  Coins,
  Lectern,
  Minus,
  Slash,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { SignOutButton } from "./page.client";
import { getEvents, getEventSubmissions, getMembers } from "@/server/api";
import { cookies } from "next/headers";
import { cn, getPointConfig } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AppPage() {
  const cookieList = await cookies();
  const events = (await getEvents()).filter((e) =>
    getPointConfig().some((pt) => pt.id == e.type),
  );
  const memberId = cookieList.get("selectedMember")?.value;
  const members = await getMembers();

  const submissions = memberId ? await getEventSubmissions(memberId) : [];

  return (
    <div className="relative flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">Member Dashboard</span>
        <SignOutButton />
      </div>
      <div className="bg-secondary/50 relative isolate flex h-auto flex-col items-start justify-end gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32 font-medium">
        <UserRound className="stroke-secondary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3" />
        <UserRound className="size-10 stroke-1" />
        <div className="flex flex-col gap-1">
          <span>
            Hello, {members.find((m) => m.id == memberId)?.firstName ?? "Guest"}
            !
          </span>
          <span className="flex items-center text-xs">
            {(members.find((m) => m.id == memberId)?.roleName ??
              "Participant") == "Participant"
              ? "Tri-M Participant"
              : "Tri-M Member"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {getPointConfig()
          .map((pt) => ({
            icon: pt.Icon,
            label: pt.name,
            amount: submissions.filter(
              (s) =>
                s.type == pt.id &&
                (s.status == "approved" || s.status == "auto-approved"),
            ).length,
            pending: submissions.filter(
              (s) => s.type == pt.id && s.status == "pending",
            ).length,
            min: Number(
              getPointConfig().find((c) => c.id == pt.id)?.minimumPoints ?? 0,
            ),
          }))
          .map(({ icon: Icon, label, amount, pending, min }) => (
            <div
              key={label}
              className="bg-secondary/50 relative isolate flex h-auto items-end justify-between gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32"
            >
              <Icon className="stroke-secondary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3" />
              <div className="flex flex-col gap-2">
                <Icon className="size-10 stroke-1" />
                <div className="text-lg">{label}</div>
              </div>
              <div
                className={cn(
                  "absolute top-4 right-4 flex h-6 items-center justify-center rounded-full",
                  amount >= min ? "bg-green-500" : "bg-red-500",
                  !memberId && "bg-gray-500",
                )}
              >
                <span className="flex items-center gap-1 px-2 py-1 text-xs text-white">
                  {memberId ? (
                    amount >= min ? (
                      <>
                        <Check className="size-3" /> Sufficient
                      </>
                    ) : (
                      <>
                        <X className="size-3" /> Insufficent
                      </>
                    )
                  ) : (
                    <>
                      <CircleSlash className="size-3" /> Unknown
                    </>
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-3xl font-bold">
                  {memberId ? amount : <Minus className="size-8" />}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  {pending != 0 ? `(${pending} pending) ` : ""}
                  <Slash className="size-3" /> {min} required
                </span>
              </div>
            </div>
          ))}
      </div>
      <h2 className="mt-4 text-xl font-bold">Events</h2>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          {[
            {
              icon: Coins,
              label: "Submit Event Attendance",
              href: "/app/events/start",
            },
            {
              icon: Lectern,
              label: "Submit Attendance",
              href: "/app/attendance/start",
            },
          ].map(({ icon: Icon, label, href }) => (
            <Button
              key={label}
              href={href}
              className="group bg-secondary/50 hover:bg-secondary relative isolate mb-2 flex h-auto w-full flex-1 items-end justify-between gap-2 overflow-clip rounded-xl !px-6 py-6 pt-32"
            >
              <Icon className="group-hover:stroke-primary stroke-secondary absolute -bottom-10 -left-10 -z-10 size-64 stroke-3 transition-all group-hover:opacity-30" />
              <div className="flex flex-col gap-2">
                <Icon className="size-10 stroke-1" />
                <div className="text-lg">{label}</div>
              </div>
            </Button>
          ))}
        </div>
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-background/40 flex flex-col items-center justify-between gap-2 rounded-md border p-4 md:flex-row"
            >
              <div className="flex w-full flex-col gap-1 md:flex-1">
                <span className="font-bold">{event.name}</span>
                <span
                  className={cn(
                    "text-muted-foreground text-xs",
                    !event.notes && "italic opacity-40",
                  )}
                >
                  {(event.notes ?? "") || "No additional notes provided"}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                      `border-${getPointConfig().find((c) => c.id == event.type)?.color}-600 bg-${getPointConfig().find((c) => c.id == event.type)?.color}-800`,
                    )}
                  >
                    <div
                      className={cn(
                        "size-3 rounded-full",
                        `bg-${getPointConfig().find((c) => c.id == event.type)?.color}-600`,
                      )}
                    />
                    {toProperCase(event.type)} Point
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-4 md:w-auto">
                <div className="flex flex-col items-end justify-center gap-2">
                  <span className="text-muted-foreground h-[0.75rem] text-xs">
                    {event.date && (
                      <>
                        on{" "}
                        {new Date(event.date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </span>
                  <span className="text-muted-foreground h-[0.75rem] text-xs">
                    {event.location && <>at {event.location}</>}
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-24 w-12"
                      href={`/app/events/submit?eventId=${event.id}`}
                    >
                      <Upload className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create a new submission request
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        ) : (
          <span className="text-muted-foreground flex items-center justify-center p-16 text-xs">
            No events found
          </span>
        )}
        <div className="bg-background/40 flex flex-col items-center justify-between gap-2 rounded-md border p-4 md:flex-row">
          <div className="flex w-full flex-col gap-1 md:flex-1">
            <span className="font-bold">Custom Event</span>
            <span className={cn("text-muted-foreground text-xs")}>
              Submit a point that is not listed above. Please use this as a last
              resort.
            </span>
            <div className="mt-2 flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                  `border-blue-600 bg-blue-800`,
                )}
              >
                <div className={cn("size-3 rounded-full", `bg-blue-600`)} />
                Custom Point
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-4 md:w-auto">
            <div className="flex flex-col items-end justify-center gap-2"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-24 w-12"
                  href={`/app/events/submit`}
                >
                  <Upload className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create a new submission request</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <h2 className="mt-4 text-xl font-bold">Submissions</h2>
      <div className="flex flex-col gap-2">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-background/40 flex flex-col items-center justify-between gap-2 rounded-md border p-4 md:flex-row"
            >
              <div className="flex w-full flex-col gap-1 md:flex-1">
                <span className="font-bold">
                  {events.find((e) => e.id == submission.eventId)?.name ??
                    submission.eventId}
                </span>
                <span className="text-muted-foreground text-xs">
                  {(() => {
                    if (
                      new RegExp("^<added by .*>$").test(
                        submission.officerNotes ?? "",
                      )
                    ) {
                      return "Added by an Officer";
                    } else if (
                      new RegExp("^<approved by .*>$").test(
                        submission.officerNotes ?? "",
                      )
                    ) {
                      return (
                        <span className="italic opacity-40">
                          No additional notes provided
                        </span>
                      );
                    } else if (submission.officerNotes) {
                      return submission.officerNotes;
                    } else {
                      return (
                        <span className="italic opacity-40">
                          No additional notes provided
                        </span>
                      );
                    }
                  })()}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                      `border-${getPointConfig().find((c) => c.id == submission.type)?.color}-600 bg-${getPointConfig().find((c) => c.id == submission.type)?.color}-800`,
                    )}
                  >
                    <div
                      className={cn(
                        "size-3 rounded-full",
                        `bg-${getPointConfig().find((c) => c.id == submission.type)?.color}-600`,
                      )}
                    />
                    {toProperCase(submission.type)} Point
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                      (submission.status == "approved" ||
                        submission.status == "auto-approved") &&
                        "border-green-600 bg-green-800",
                      submission.status == "rejected" &&
                        "border-red-600 bg-red-800",
                      submission.status == "pending" &&
                        "border-yellow-600 bg-yellow-800",
                      submission.status == "cancelled" &&
                        "border-gray-600 bg-gray-800",
                    )}
                  >
                    <div
                      className={cn(
                        "size-3 rounded-full",
                        (submission.status == "approved" ||
                          submission.status == "auto-approved") &&
                          "bg-green-600",
                        submission.status == "rejected" && "bg-red-600",
                        submission.status == "pending" && "bg-yellow-600",
                        submission.status == "cancelled" && "bg-gray-600",
                      )}
                    />
                    {toProperCase(submission.status)}
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-4 md:w-auto">
                <div className="flex flex-col items-end justify-center gap-2">
                  <span className="text-muted-foreground h-[0.75rem] text-xs">
                    Submitted{" "}
                    {new Date(
                      submission.createdAt ?? new Date(),
                    ).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-muted-foreground h-[0.75rem] text-xs">
                    {toProperCase(submission.status)}{" "}
                    {new Date(
                      submission.updatedAt ?? new Date(),
                    ).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-24 w-12"
                  disabled
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <span className="text-muted-foreground flex items-center justify-center p-16 text-xs">
            No submissions found
          </span>
        )}
      </div>
    </div>
  );
}

function toProperCase(s: string) {
  return s
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
