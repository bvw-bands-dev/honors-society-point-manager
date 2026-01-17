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
  CircleAlert,
  CornerDownRight,
  Eraser,
  Loader,
  Save,
  Slash,
  Trash,
} from "lucide-react";
import { action, type Members } from "./page.action";
import { useFormStatus } from "react-dom";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

function emptyOfficer(): Members[number] {
  return {
    id: "",
    firstName: "",
    lastName: "",
    role: "" as "officer",
    roleName: "",
    email: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function OfficersClientPage({
  members,
  officers: defaultOfficers,
  self,
}: {
  members: Members;
  officers: Members;
  self: Members[number];
}) {
  const [officers, setOfficers] = useState(defaultOfficers);

  useEffect(() => {
    let newOfficers = officers;
    if (
      officers.length == 0 ||
      !Object.values({
        ...officers.at(-1),
        id: undefined,
        role: undefined,
        roleName: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      }).every((value) => value == "" || value == undefined) ||
      officers.at(-1)!.role != emptyOfficer().role ||
      officers.at(-1)!.roleName != emptyOfficer().roleName
    ) {
      newOfficers = [...officers, emptyOfficer()];
    }
    newOfficers = newOfficers.filter((officer, idx, arr) => {
      if (idx == arr.length - 1) return true;
      const isEmpty =
        Object.values({
          ...officer,
          role: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }).every((value) => value == "" || value == undefined) &&
        officer.role == emptyOfficer().role &&
        officer.roleName == emptyOfficer().roleName;
      return !isEmpty;
    });
    if (JSON.stringify(officers) != JSON.stringify(newOfficers)) {
      setOfficers(newOfficers);
    }
  }, [officers]);

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
          Officers
        </span>
        <SaveButton
          disabled={officers.some(
            (officer) =>
              officers.filter(
                (o) => o.email == officer.email && o.email != "" && o.id != "",
              ).length >= 2 ||
              officers.filter((o) => o.id == officer.id && o.id != "").length >=
                2,
          )}
        />
      </div>
      <div className="flex flex-col gap-6">
        <input type="hidden" name="officers" value={JSON.stringify(officers)} />
        {officers.map((officer) => (
          <div
            className="mb-4 flex flex-col gap-2 md:mb-0"
            key={String(officer.id)}
            id={officer.id}
          >
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col items-center gap-2 md:flex-row">
                <Combobox
                  groups={[
                    {
                      id: "members",
                      header: "Members",
                      values: members.map((o) => ({
                        id: o.id,
                        label: `${o.firstName} ${o.lastName}`,
                        render: `${o.firstName} ${o.lastName}`,
                      })),
                    },
                  ]}
                  value={officer.id}
                  setValue={(value) => {
                    setOfficers((prev) =>
                      prev.map((o) =>
                        o.id == officer.id ? { ...o, id: value } : o,
                      ),
                    );
                  }}
                  allowCustomOption
                  customOptionLabel={(option) => (
                    <>
                      Add {'"'}
                      {option}
                      {'"'}
                    </>
                  )}
                  optionLabel={(option) => <>{option}</>}
                  placeholders={{
                    emptyValue: "Search members...",
                  }}
                  className="w-full md:w-[40ch]"
                  disabled={
                    officer.role == "staff" &&
                    self.role != "owner" &&
                    self.role != "staff"
                  }
                />
                <Combobox
                  groups={[
                    {
                      id: "roles",
                      header: "Roles",
                      values: [
                        ...[
                          "President",
                          "Vice President",
                          "Secretary",
                          ...(self.role == "owner" || self.role == "staff"
                            ? ["Staff"]
                            : []),
                        ].map((r) => ({
                          id: r,
                          label: r,
                          render: r,
                        })),
                      ],
                    },
                  ]}
                  allowCustomOption
                  customOptionLabel={(option) => (
                    <>
                      Use {'"'}
                      {option}
                      {'"'}
                    </>
                  )}
                  optionLabel={(option) => <>{option}</>}
                  restrictCustomOption={(option) => option == "Staff"}
                  value={officer.roleName}
                  setValue={(value) => {
                    setOfficers((prev) =>
                      prev.map((o) =>
                        o.id == officer.id ? { ...o, roleName: value } : o,
                      ),
                    );
                  }}
                  placeholders={{
                    emptyValue: "Search roles...",
                  }}
                  disabled={(() => {
                    if (officer.role == "staff") {
                      return self.role != "owner" && self.role != "staff";
                    }
                    return false;
                  })()}
                  className="w-full md:flex-1"
                />
              </div>
              {officers.filter((o) => o.id == officer.id).length >= 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-yellow-800">
                      <CircleAlert className="size-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    This member is already assigned to a different role
                  </TooltipContent>
                </Tooltip>
              )}
              {officers.filter(
                (o) => o.roleName == officer.roleName && o.id != "",
              ).length >= 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-yellow-800">
                      <CircleAlert className="size-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Duplicate role name
                  </TooltipContent>
                </Tooltip>
              )}
              {officer.id == "" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (self.role == "owner" || self.role == "staff") {
                          setOfficers([]);
                        } else {
                          setOfficers((prev) =>
                            prev.filter(
                              (o) => o.role == "owner" || o.role == "staff",
                            ),
                          );
                        }
                      }}
                    >
                      <Eraser />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Delete all officers
                  </TooltipContent>
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
                          setOfficers((prev) =>
                            prev.filter((o) => o != officer),
                          );
                        }}
                        disabled={(() => {
                          if (officer.role == "staff") {
                            return self.role != "owner" && self.role != "staff";
                          }
                          return false;
                        })()}
                      >
                        <Trash />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {(() => {
                      if (officer.role == "staff") {
                        return self.role != "owner" && self.role != "staff";
                      }
                      return false;
                    })() ? (
                      <>You cannot remove a {officer.role} member.</>
                    ) : (
                      <>Delete this member</>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-4 px-8">
              <CornerDownRight
                className={cn(
                  "size-4",
                  (() => {
                    if (officer.role == "staff") {
                      return self.role != "owner" && self.role != "staff";
                    }
                    return false;
                  })() && "opacity-50",
                )}
              />
              <Input
                value={officer.email ?? ""}
                onChange={(evt) =>
                  setOfficers((prev) =>
                    prev.map((o) =>
                      o.id == officer.id
                        ? { ...o, email: evt.target.value }
                        : o,
                    ),
                  )
                }
                disabled={(() => {
                  if (officer.role == "staff") {
                    return self.role != "owner" && self.role != "staff";
                  }
                  return false;
                })()}
                placeholder="john.doe@example.com"
              />
              {officers.filter(
                (o) => o.email == officer.email && o.email != "" && o.id != "",
              ).length >= 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500">
                      <CircleAlert className="size-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">Duplicate email</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
    </form>
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
      toast.loading("Saving officers...", { id: "save-officers" });
    } else {
      toast.success("Officers saved!", { id: "save-officers" });
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
