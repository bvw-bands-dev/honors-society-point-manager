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

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  CircleAlert,
  Eraser,
  ExternalLink,
  Loader,
  MoreHorizontal,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Slash,
  Trash,
  UsersRound,
} from "lucide-react";
import {
  action,
  type Events,
  type Members,
  type Submissions,
} from "./page.action";
import { useFormStatus } from "react-dom";
import Fuse from "fuse.js";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  ResponsivePopover,
  ResponsivePopoverBody,
  ResponsivePopoverContent,
  ResponsivePopoverDescription,
  ResponsivePopoverHeader,
  ResponsivePopoverTitle,
  ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import QRCode from "react-qr-code";

function randomCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function emptyEvent(): Events[number] {
  return {
    id: crypto.randomUUID(),
    name: "",
    date: null,
    location: "Blue Valley West High School",
    hasQrSubmission: true,
    needsAdditionalInfo: false,
    notes: "",
    type: "attendance",
    verificationCode: randomCode(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function AttendanceClientPage({
  members,
  self,
  events: defaultEvents,
  submissions: defaultSubmisisons,
}: {
  members: Members;
  self: Members[number];
  events: Events;
  submissions: Submissions;
}) {
  const [events, setEvents] = useState(defaultEvents);
  const [submissions, setSubmissions] = useState(defaultSubmisisons);
  const [addedMembers, setAddedMembers] = useState<Members>([]);

  useEffect(() => {
    setTimeout(() => {
      const newMembers = addedMembers.filter((m) =>
        submissions.find((s) => s.memberId == m.id),
      );
      if (JSON.stringify(addedMembers) != JSON.stringify(newMembers)) {
        setAddedMembers(newMembers);
      }
    }, 100);
  }, [addedMembers, submissions]);

  useEffect(() => {
    let newEvents = events;
    if (events.length == 0 || events.at(-1)?.date != null) {
      newEvents = [...newEvents, emptyEvent()];
    }
    newEvents = newEvents.filter((event, idx, arr) => {
      if (idx == arr.length - 1) return true;
      return event.date != null;
    });
    if (JSON.stringify(events) != JSON.stringify(newEvents)) {
      setEvents(newEvents);
    }
  }, [events]);

  return (
    <form action={action} className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/portal"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">
          <span className="hidden items-center gap-2 md:flex">
            Officer Portal <Slash className="size-3" />
          </span>{" "}
          Attendance
        </span>
        <SaveButton
          disabled={(() => {
            return events.some(
              (e) =>
                events.filter(
                  (f) =>
                    new Date(e.date ?? new Date()).getTime() ==
                    new Date(f.date ?? new Date()).getTime(),
                ).length > 1,
            );
          })()}
        />
      </div>
      <div className="flex flex-col gap-6 md:gap-2">
        <input type="hidden" name="events" value={JSON.stringify(events)} />
        <input
          type="hidden"
          name="submissions"
          value={JSON.stringify(submissions)}
        />
        <input
          type="hidden"
          name="members"
          value={JSON.stringify([
            ...members.filter((m) => m.role == "participant"),
            ...addedMembers,
          ])}
        />
        {events.map((event) => {
          const qrURL = new URL(
            "/app/attendance/submit",
            window.location.origin,
          );
          qrURL.searchParams.set(
            "eventDate",
            new Date(event.date ?? new Date())?.toISOString() ?? "",
          );
          qrURL.searchParams.set("code", event.verificationCode ?? "");

          return (
            <div className="flex gap-2" key={String(event.id)} id={event.id}>
              <ResponsivePopover>
                <ResponsivePopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    data-empty={!event.date}
                    className="data-[empty=true]:text-muted-foreground h-9 w-[calc(100%-theme(spacing.4))] flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {event.date ? (
                      new Date(event.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </ResponsivePopoverTrigger>
                <ResponsivePopoverContent className="bg-background w-auto p-0">
                  <Calendar
                    mode="single"
                    fixedWeeks
                    selected={event.date ?? undefined}
                    onSelect={(val) => {
                      if (!val) return;
                      setEvents((prev) =>
                        prev.map((o) =>
                          o.id == event.id ? { ...o, date: new Date(val) } : o,
                        ),
                      );
                    }}
                    className="mx-auto"
                  />
                </ResponsivePopoverContent>
              </ResponsivePopover>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                {event.hasQrSubmission && (
                  <ResponsivePopover>
                    <ResponsivePopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <QrCode />
                      </Button>
                    </ResponsivePopoverTrigger>
                    <ResponsivePopoverContent
                      side="bottom"
                      align="end"
                      popoverClassName="w-[30ch]"
                    >
                      <QRCode
                        value={qrURL.toString() ?? ""}
                        bgColor="transparent"
                        fgColor="var(--foreground)"
                        className="aspect-square w-full"
                      />
                      <div className="flex items-center justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          href={`/qr?value=${encodeURIComponent(qrURL.toString())}&code=${encodeURIComponent(event.verificationCode ?? "")}&label=${encodeURIComponent(new Date(event.date ?? new Date())?.toDateString() ?? "")}&print=true`}
                          onClick={(evt) => {
                            evt.preventDefault();
                            window.open(
                              `/qr?value=${encodeURIComponent(qrURL.toString())}&code=${encodeURIComponent(event.verificationCode ?? "")}&label=${encodeURIComponent(new Date(event.date ?? new Date())?.toDateString() ?? "")}&print=true`,
                              "qr code",
                              "width=1000,height=500,status=no,toolbar=no",
                            );
                          }}
                        >
                          Print <Printer className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          href={`/qr?value=${encodeURIComponent(qrURL.toString())}&code=${encodeURIComponent(event.verificationCode ?? "")}&label=${encodeURIComponent(new Date(event.date ?? new Date())?.toDateString() ?? "")}`}
                          onClick={(evt) => {
                            evt.preventDefault();
                            window.open(
                              `/qr?value=${encodeURIComponent(qrURL.toString())}&code=${encodeURIComponent(event.verificationCode ?? "")}&label=${encodeURIComponent(new Date(event.date ?? new Date())?.toDateString() ?? "")}`,
                              "qr code",
                              "width=1000,height=500,status=no,toolbar=no",
                            );
                          }}
                        >
                          Open <ExternalLink className="size-4" />
                        </Button>
                      </div>
                    </ResponsivePopoverContent>
                  </ResponsivePopover>
                )}
                <ResponsivePopover>
                  <ResponsivePopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <UsersRound />
                    </Button>
                  </ResponsivePopoverTrigger>
                  <ResponsivePopoverContent
                    side="bottom"
                    align="end"
                    popoverClassName="w-[40ch] max-h-[calc(var(--radix-popover-content-available-height)-theme(spacing.4))] overflow-auto scroll scroll-py-4"
                  >
                    <MemberSelector
                      members={members}
                      addedMembers={addedMembers}
                      setAddedMembers={setAddedMembers}
                      submissions={submissions}
                      setSubmissions={setSubmissions}
                      event={event}
                      self={self}
                    />
                  </ResponsivePopoverContent>
                </ResponsivePopover>
                <ResponsivePopover>
                  <ResponsivePopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </ResponsivePopoverTrigger>
                  <ResponsivePopoverContent
                    side="bottom"
                    align="end"
                    popoverClassName="w-[40ch]"
                  >
                    <ResponsivePopoverHeader>
                      <ResponsivePopoverTitle>
                        Event Details
                      </ResponsivePopoverTitle>
                      <ResponsivePopoverDescription>
                        Add Event Descriptions
                      </ResponsivePopoverDescription>
                    </ResponsivePopoverHeader>
                    <ResponsivePopoverBody className="flex flex-col gap-2">
                      <label className="flex w-full flex-col items-start justify-between gap-2">
                        <span>Location</span>
                        <Input
                          className="ml-4 h-9 w-[calc(100%-theme(spacing.4))]"
                          value={event.location ?? ""}
                          onChange={(e) => {
                            setEvents((prev) =>
                              prev.map((o) =>
                                o.id == event.id
                                  ? { ...o, location: e.target.value }
                                  : o,
                              ),
                            );
                          }}
                          placeholder="Blue Valley West High School"
                        />
                      </label>
                      <label className="flex w-full flex-col items-start justify-between gap-2">
                        <span>Notes</span>
                        <Textarea
                          className="ml-4 h-24 w-[calc(100%-theme(spacing.4))] resize-none"
                          value={event.notes ?? ""}
                          onChange={(e) => {
                            setEvents((prev) =>
                              prev.map((o) =>
                                o.id == event.id
                                  ? { ...o, notes: e.target.value }
                                  : o,
                              ),
                            );
                          }}
                          placeholder="Can only be submitted once per year"
                        />
                      </label>
                      <label
                        className={cn(
                          "flex h-9 w-full items-center justify-between gap-2",
                          !event.hasQrSubmission && "hidden",
                        )}
                      >
                        <span>QR Verification Code</span>
                        <div className="flex items-center gap-2">
                          <Input
                            className="max-w-[10ch] text-right font-mono"
                            readOnly
                            value={event.verificationCode ?? ""}
                          />
                          <Button
                            onClick={() => {
                              setEvents((prev) =>
                                prev.map((o) =>
                                  o.id == event.id
                                    ? {
                                        ...o,
                                        verificationCode: randomCode(),
                                      }
                                    : o,
                                ),
                              );
                            }}
                            size="icon"
                          >
                            <RefreshCw />
                          </Button>
                        </div>
                      </label>
                    </ResponsivePopoverBody>
                  </ResponsivePopoverContent>
                </ResponsivePopover>
                {events.filter(
                  (e) =>
                    new Date(e.date ?? new Date()).getTime() ==
                    new Date(event.date ?? new Date()).getTime(),
                ).length >= 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-800">
                        <CircleAlert className="size-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      This event already exists in the list.
                    </TooltipContent>
                  </Tooltip>
                )}
                {event.date == null ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setEvents([])}
                      >
                        <Eraser />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Delete all events
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setEvents((prev) =>
                              prev.filter((e) => e.id != event.id),
                            );
                          }}
                        >
                          <Trash />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Delete this event
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </form>
  );
}

function MemberSelector({
  members,
  addedMembers,
  setAddedMembers,
  submissions,
  setSubmissions,
  event,
  self,
}: {
  members: Members;
  addedMembers: Members;
  setAddedMembers: Dispatch<SetStateAction<Members>>;
  submissions: Submissions;
  setSubmissions: Dispatch<SetStateAction<Submissions>>;
  event: Events[number];
  self: Members[number];
}) {
  const [participantSearch, setParticipantSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Calculate filtered members and options
  const allMembers = [...members, ...addedMembers].sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName) ||
      a.firstName.localeCompare(b.firstName),
  );

  // Configure Fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    return new Fuse(allMembers, {
      keys: [
        { name: "firstName", weight: 0.6 },
        { name: "lastName", weight: 0.6 },
        {
          name: "fullName",
          weight: 0.8,
          getFn: (member) => `${member.firstName} ${member.lastName}`,
        },
        {
          name: "reverseName",
          weight: 0.4,
          getFn: (member) => `${member.lastName} ${member.firstName}`,
        },
      ],
      threshold: 0.3, // Lower = more strict matching (0.0 = exact, 1.0 = match anything)
      distance: 100, // Maximum distance for fuzzy matching
      minMatchCharLength: 1,
      includeScore: true,
    });
  }, [allMembers]);

  // Use Fuse.js for searching or show all if no search
  const filteredMembers = useMemo(() => {
    if (!participantSearch.trim()) {
      return allMembers;
    }

    const results = fuse.search(participantSearch.trim());
    return results.map((result) => result.item);
  }, [fuse, participantSearch, allMembers]);

  const selectedMembers = filteredMembers.filter((m) =>
    submissions.some((s) => s.eventId == event.id && s.memberId == m.id),
  );

  const unselectedMembers = filteredMembers.filter(
    (m) =>
      !submissions.some((s) => s.eventId == event.id && s.memberId == m.id),
  );

  // Check if we should show "Add new member" option
  const showAddOption =
    participantSearch.trim() != "" &&
    !allMembers.find(
      (m) => participantSearch.trim() == `${m.firstName} ${m.lastName}`,
    );

  // All clickable options in order: selected members, unselected members, add option
  const allOptions = [
    ...selectedMembers,
    ...unselectedMembers,
    ...(showAddOption ? [null] : []), // null represents the "Add" option
  ];

  const totalOptions = allOptions.length;

  // Reset focus when search changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [participantSearch]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && buttonRefs.current[focusedIndex]) {
      buttonRefs.current[focusedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (totalOptions == 0) return;

    if (focusedIndex == -1) {
      setFocusedIndex(0);
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalOptions) {
          buttonRefs.current[focusedIndex]?.click();
        }
        break;
      case "Escape":
        e.preventDefault();
        setFocusedIndex(-1);
        break;
    }
  };

  const handleMemberClick = (member: Members[number]) => {
    if (
      submissions.some((s) => s.eventId == event.id && s.memberId == member.id)
    ) {
      setSubmissions((prev) =>
        prev.filter((s) => !(s.eventId == event.id && s.memberId == member.id)),
      );
    } else {
      setSubmissions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          eventId: event.id,
          memberId: member.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: "",
          eventDate: event.date ?? null,
          officerNotes: `<added by ${self.id}>`,
          status: "approved",
          type: event.type,
          uploadLink: "",
        },
      ]);
    }
  };

  const handleAddNewMember = () => {
    const newMember: Members[number] = {
      id: crypto.randomUUID(),
      firstName: participantSearch.trim().split(" ")[0],
      lastName: participantSearch.trim().split(" ").slice(1).join(" "),
      email: "",
      role: "participant",
      roleName: "Participant",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAddedMembers((prev) => [...prev, newMember]);
    setSubmissions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        eventId: event.id,
        memberId: newMember.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: "",
        eventDate: event.date ?? null,
        officerNotes: `<added by ${self.id}>`,
        status: "approved",
        type: event.type,
        uploadLink: "",
      },
    ]);
    setParticipantSearch("");
  };

  const renderMemberButton = (member: Members[number], index: number) => {
    const isSelected = submissions.some(
      (s) => s.eventId == event.id && s.memberId == member.id,
    );
    const isFocused = focusedIndex == index;

    return (
      <Button
        key={member.id}
        ref={(el) => {
          buttonRefs.current[index] = el;
        }}
        variant="outline"
        className={cn(
          "h-14 justify-between",
          isFocused && "ring-primary ring-2",
        )}
        onClick={() => handleMemberClick(member)}
      >
        <div className="flex flex-col items-start">
          <span>
            {member.firstName} {member.lastName}
          </span>
          <span className="text-muted-foreground text-xs">
            {member.roleName}
          </span>
        </div>
        <Check
          className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
        />
      </Button>
    );
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="border-input focus-within:ring-primary flex h-9 items-center gap-2 rounded-lg border px-2 py-2 focus-within:ring">
        <Search className="size-4" />
        <input
          className="flex-1 text-sm outline-0"
          placeholder="Search Participants... (Use ↑↓ to navigate, Enter to select)"
          value={participantSearch}
          onChange={(e) => setParticipantSearch(e.target.value)}
        />
      </label>
      <div className="flex flex-col gap-2 pt-2">
        {totalOptions == 0 ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground p-4 text-center text-xs">
              No participants selected{" "}
              {participantSearch.trim() != "" && "matching query"}
            </span>
          </div>
        ) : (
          <>
            {/* Selected members */}
            {selectedMembers.map((member, index) =>
              renderMemberButton(member, index),
            )}

            {/* Divider if we have both selected and unselected */}
            {selectedMembers.length > 0 && unselectedMembers.length > 0 && (
              <div className="bg-accent mx-auto h-1 w-20 rounded-full" />
            )}

            {/* Unselected members */}
            {unselectedMembers.map((member, index) =>
              renderMemberButton(member, selectedMembers.length + index),
            )}

            {/* Add new member option */}
            {showAddOption && (
              <Button
                ref={(el) => {
                  buttonRefs.current[totalOptions - 1] = el;
                }}
                onClick={handleAddNewMember}
                variant="outline"
                className={cn(
                  "h-14 justify-between",
                  focusedIndex == totalOptions - 1 && "ring-primary ring-2",
                )}
              >
                <div className="flex flex-col items-start">
                  <span>
                    Add {'"'}
                    {participantSearch.trim()}
                    {'"'}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Participant
                  </span>
                </div>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SaveButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      setTimeout(() => {
        firstRender.current = false;
      }, 100);
      return;
    }
    if (pending) {
      toast.loading("Saving events...", { id: "save-events" });
    } else {
      toast.success("Events saved!", { id: "save-events" });
    }
  }, [pending]);

  return (
    <Button
      type="submit"
      className="border-primary size-12 border-2"
      disabled={disabled || pending}
    >
      {pending ? <Loader className="animate-spin" /> : <Save />}
    </Button>
  );
}
