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
  ArrowLeftRight,
  CircleAlert,
  Eraser,
  Loader,
  Save,
  Slash,
  Trash,
} from "lucide-react";
import {
  action,
  type Members,
  type PointBoost,
  type Submissions,
} from "./page.action";
import { useFormStatus } from "react-dom";

import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn, getPointConfig } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function emptyMember(): Members[number] {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    role: "member",
    roleName: "Member",
    email: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function MembersClientPage({
  members: defaultMembers,
  submissions,
  self,
}: {
  members: Members;
  submissions: Submissions;
  self: Members[number];
}) {
  const config = getPointConfig();
  const [members, setMembers] = useState(defaultMembers);
  const [pointBoosts, setPointBoosts] = useState<PointBoost>({});

  useEffect(() => {
    const newPointBoost = pointBoosts;
    for (const submission of submissions) {
      if (submission.eventId == "<point_boost>") {
        newPointBoost[submission.memberId] ??= {};
        newPointBoost[submission.memberId][submission.type] =
          (newPointBoost[submission.memberId][submission.type] ?? 0) + 1;
      }
    }
    setPointBoosts(newPointBoost);
  }, [pointBoosts, submissions]);

  useEffect(() => {
    let newMembers = members;
    if (
      members.length == 0 ||
      !Object.values({
        ...members.at(-1),
        id: undefined,
        role: undefined,
        roleName: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      }).every((value) => value == "" || value == undefined) ||
      members.at(-1)!.role != emptyMember().role ||
      members.at(-1)!.roleName != emptyMember().roleName
    ) {
      newMembers = [...members, emptyMember()];
    }
    newMembers = newMembers.filter((member, idx, arr) => {
      if (idx == arr.length - 1) return true;
      const isEmpty =
        Object.values({
          ...member,
          id: undefined,
          role: undefined,
          roleName: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }).every((value) => value == "" || value == undefined) &&
        member.role == emptyMember().role &&
        member.roleName == emptyMember().roleName;
      return !isEmpty;
    });
    if (JSON.stringify(members) != JSON.stringify(newMembers)) {
      setMembers(newMembers);
    }
  }, [members]);

  async function handlePaste(el: HTMLInputElement) {
    const value = await navigator.clipboard.readText();
    if (
      el.value == value ||
      (!value.includes("\n") && !(value.includes("\t") || value.includes(" ")))
    )
      return;
    const table = value
      .split("\n")
      .map((row) =>
        row.split("\t").length > 1 ? row.split("\t") : row.split(" "),
      );

    const newMembers = members.slice(0, -1);

    for (const [first, last] of table) {
      if (first && last) {
        newMembers.push({
          ...emptyMember(),
          firstName: first.trim(),
          lastName: last.trim(),
          role: "member",
          roleName: "Member",
        });
      }
    }

    setMembers(newMembers);

    setTimeout(() => {
      const inputs = Array.from(document.querySelectorAll("input"));
      inputs.at(-2)!.focus();
    }, 100);
  }

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
          Members
        </span>
        <SaveButton
          disabled={(() => {
            return members.some(
              (member, idx, arr) =>
                arr.findIndex(
                  (m) =>
                    m.firstName.trim().toLowerCase() ==
                      member.firstName.trim().toLowerCase() &&
                    m.lastName.trim().toLowerCase() ==
                      member.lastName.trim().toLowerCase(),
                ) != idx,
            );
          })()}
        />
      </div>
      <div className="flex flex-col gap-4 md:gap-2">
        <input type="hidden" name="members" value={JSON.stringify(members)} />
        <input
          type="hidden"
          name="pointBoosts"
          value={JSON.stringify(pointBoosts)}
        />
        {members.map((member) => (
          <div className="flex gap-2" key={String(member.id)} id={member.id}>
            <div className="flex flex-1 flex-col items-center gap-2 md:flex-row">
              <Popover>
                <PopoverTrigger className="mr-auto" asChild>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    {getPointConfig().map(({ id: type, Icon }) => (
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-full px-4 py-1",
                          (() => {
                            const subs =
                              submissions.filter(
                                (s) =>
                                  s.memberId == member.id &&
                                  s.type == type &&
                                  s.eventId != "<point_boost>" &&
                                  (s.status == "approved" ||
                                    s.status == "auto-approved"),
                              ).length + (pointBoosts[member.id]?.[type] ?? 0);
                            if (subs == 0) {
                              return "bg-red-800";
                            }
                            return subs >=
                              Number(
                                config.find((c) => c.id == type)
                                  ?.minimumPoints ?? 1,
                              )
                              ? "bg-green-800"
                              : "bg-yellow-800";
                          })(),
                        )}
                        key={type}
                      >
                        <Icon className="size-4" />
                      </div>
                    ))}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[30ch]">
                  <div className="flex flex-col gap-4">
                    {getPointConfig().map(({ id: type, Icon }) => (
                      <div className="flex flex-col" key={type}>
                        <div className="flex items-center gap-2">
                          <PercentageChart
                            percent={
                              (submissions.filter(
                                (s) =>
                                  s.memberId == member.id &&
                                  s.type == type &&
                                  s.eventId != "<point_boost>" &&
                                  (s.status == "approved" ||
                                    s.status == "auto-approved"),
                              ).length +
                                (pointBoosts[member.id]?.[type] ?? 0)) /
                              Number(
                                config.find((c) => c.id == type)
                                  ?.minimumPoints ?? 1,
                              )
                            }
                          />
                          <span className="flex flex-1 items-center gap-2">
                            <Icon className="size-4" />
                            {toProperCase(type)} Points
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            {submissions.filter(
                              (s) =>
                                s.memberId == member.id &&
                                s.type == type &&
                                s.eventId != "<point_boost>" &&
                                (s.status == "approved" ||
                                  s.status == "auto-approved"),
                            ).length + (pointBoosts[member.id]?.[type] ?? 0)}
                            {submissions.filter(
                              (s) =>
                                s.memberId == member.id &&
                                s.type == type &&
                                s.status == "pending",
                            ).length != 0 &&
                              ` (${
                                submissions.filter(
                                  (s) =>
                                    s.memberId == member.id &&
                                    s.type == type &&
                                    s.eventId != "<point_boost>" &&
                                    s.status != "approved" &&
                                    s.status != "auto-approved",
                                ).length
                              } pending)`}
                            <Slash className="size-3" />{" "}
                            {Number(
                              config.find((c) => c.id == type)?.minimumPoints ??
                                1,
                            )}
                          </span>
                          <Input
                            value={pointBoosts[member.id]?.[type] ?? 0}
                            onChange={(evt) => {
                              setPointBoosts((prev) => ({
                                ...prev,
                                [member.id]: {
                                  ...prev[member.id],
                                  [type]: Number(evt.target.value),
                                },
                              }));
                            }}
                            type="number"
                            className="w-[10ch]"
                            min={0}
                            max={5}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={member.firstName}
                onChange={(e) => {
                  setMembers((prev) =>
                    prev.map((o) =>
                      o.id == member.id
                        ? { ...o, firstName: e.target.value }
                        : o,
                    ),
                  );
                }}
                onPaste={(e) => {
                  handlePaste(e.currentTarget).catch(console.error);
                }}
                className="h-9 md:w-[40ch]"
                placeholder="John"
              />
              <Input
                value={member.lastName}
                onChange={(e) => {
                  setMembers((prev) =>
                    prev.map((o) =>
                      o.id == member.id
                        ? { ...o, lastName: e.target.value }
                        : o,
                    ),
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key == "Enter") {
                    e.preventDefault();
                    setMembers((prev) => [...prev, emptyMember()]);
                  }
                }}
                className="mb-4 h-9 md:mb-0 md:flex-1"
                placeholder="Doe"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={() => {
                    setMembers((prev) =>
                      prev.map((o) =>
                        o.id == member.id
                          ? {
                              ...o,
                              role:
                                member.role != "member"
                                  ? "member"
                                  : "participant",
                              roleName: "Member",
                            }
                          : o,
                      ),
                    );
                  }}
                  disabled={
                    member.role != "member" && member.role != "participant"
                  }
                  variant="ghost"
                  className={
                    member.role != "member"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-transparent"
                  }
                  size="icon"
                >
                  <ArrowLeftRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Switch to {member.role != "member" ? "Member" : "Participant"}
              </TooltipContent>
            </Tooltip>
            {members.filter(
              (m) =>
                m.firstName == member.firstName &&
                m.lastName == member.lastName,
            ).length >= 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-800">
                    <CircleAlert className="size-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  This member already exists in the list.
                </TooltipContent>
              </Tooltip>
            )}
            {member.firstName == "" &&
            member.lastName == "" &&
            member.email == "" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (self.role == "owner") {
                        setMembers([]);
                      } else if (self.role == "staff") {
                        setMembers((prev) =>
                          prev.filter((m) => m.role == "staff"),
                        );
                      } else {
                        setMembers((prev) =>
                          prev.filter(
                            (m) => m.role == "staff" || m.role == "officer",
                          ),
                        );
                      }
                    }}
                  >
                    <Eraser />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Delete all members</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setMembers((prev) =>
                          prev.filter((o) => o.id != member.id),
                        );
                      }}
                      disabled={(() => {
                        if (self.role == "owner" || self.role == "staff")
                          return false;
                        return (
                          member.role == "staff" || member.role == "officer"
                        );
                      })()}
                    >
                      <Trash />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {member.role == "officer" ? (
                    <>You cannot remove a {member.role} member.</>
                  ) : (
                    <>Delete this member</>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ))}
      </div>
    </form>
  );
}

function PercentageChart({ percent }: { percent: number }) {
  const chartData = [
    {
      category: "progress",
      value: percent,
      fill: "color-mix(in oklab, var(--primary), var(--secondary) 30%)",
    },
  ];

  const chartConfig = {
    value: {
      label: "Progress",
    },
    progress: {
      label: "Progress",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square size-10 shrink-0"
    >
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={90 - percent * 360}
        innerRadius={15}
        outerRadius={30}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[16.5, 13.5]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false} />
      </RadialBarChart>
    </ChartContainer>
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
      toast.loading("Saving members...", { id: "save-members" });
    } else {
      toast.success("Members saved!", { id: "save-members" });
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

function toProperCase(s: string) {
  return s
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
