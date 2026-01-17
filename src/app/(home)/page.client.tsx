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
import { auth } from "@/lib/auth";
import { ArrowRight, Search, ShieldUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Members } from "./page";
import {
  ResponsivePopover,
  ResponsivePopoverBody,
  ResponsivePopoverContent,
  ResponsivePopoverHeader,
  ResponsivePopoverTitle,
  ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import Fuse from "fuse.js";
import { cn } from "@/lib/utils";

export function OfficerButton() {
  const router = useRouter();
  const { data: session } = auth.useSession();

  useEffect(() => {
    toast.dismiss();
  }, []);

  return (
    <Button
      variant="link"
      className="text-foreground/50 !px-2"
      href="/portal"
      onClick={async (evt) => {
        evt.preventDefault();
        if (session) {
          router.push("/portal");
        } else {
          await auth.signIn.social({
            provider: "google",
            callbackURL: "/portal",
          });
        }
      }}
    >
      <ShieldUser />
      <span className="hidden md:inline">Officer Portal</span>
    </Button>
  );
}

export function ContinueButton({
  members: membersList,
  defaultMemberId,
}: {
  members: Members;
  defaultMemberId?: string;
}) {
  const [members, setMembers] = useState<Members>(membersList);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [defaultMember, setDefaultMember] = useState<Members[number] | null>(
    membersList.find((m) => m.id == defaultMemberId) ?? null,
  );

  // Cookie helper functions
  const getCookie = (name: string): string | null => {
    if (typeof document == "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length == 2) {
      return parts.pop()?.split(";").shift() ?? null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, days = 30): void => {
    if (typeof document == "undefined") return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const deleteCookie = (name: string): void => {
    if (typeof document == "undefined") return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  };

  useEffect(() => {
    const selectedMemberId = getCookie("selectedMember");
    if (selectedMemberId) {
      const member = membersList.find((m) => m.id == selectedMemberId);
      if (member) {
        setDefaultMember(member);
      } else {
        deleteCookie("selectedMember");
      }
    } else {
      setDefaultMember(null);
    }
  }, [membersList]);

  const fuse = useMemo(() => {
    return new Fuse(membersList, {
      keys: [
        { name: "firstName", weight: 0.6 },
        { name: "lastName", weight: 0.6 },
        {
          name: "fullName",
          weight: 0.8,
          getFn: (member) => `${member.firstName} ${member.lastName}`,
        },
      ],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [membersList]);

  // Use Fuse.js for searching
  useEffect(() => {
    if (search.trim()) {
      const results = fuse.search(search.trim()).map((result) => result.item);
      setMembers(results);
    } else {
      setMembers(membersList);
    }
  }, [search, fuse, membersList]);

  // Reset focus when search changes
  useEffect(() => {
    setFocusedIndex(-1);
    buttonRefs.current = [];
  }, [search]);

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
    const totalOptions = members.length;
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
    setCookie("selectedMember", member.id);
    router.push("/app");
  };

  return (
    <div className="flex flex-col items-end gap-1 px-4">
      <ResponsivePopover>
        <ResponsivePopoverTrigger asChild>
          <Button className="relative isolate">
            <div className="bg-primary pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[15rem] -translate-1/2 blur-[10rem]" />
            Continue <ArrowRight />
          </Button>
        </ResponsivePopoverTrigger>
        <ResponsivePopoverContent
          className="max-h-[calc(var(--radix-popover-content-available-height)-theme(spacing.4))] scroll-py-4 overflow-auto"
          popoverClassName="w-[40ch]"
          align="end"
        >
          <ResponsivePopoverHeader>
            <ResponsivePopoverTitle>
              <div className="flex items-center gap-2">
                Select a member to continue
              </div>
            </ResponsivePopoverTitle>
          </ResponsivePopoverHeader>
          <ResponsivePopoverBody>
            <div
              ref={containerRef}
              className="flex flex-col justify-start gap-2"
              onKeyDown={handleKeyDown}
            >
              <label className="border-input focus-within:ring-primary flex h-9 items-center gap-2 rounded-lg border px-2 py-2 focus-within:ring">
                <Search className="size-4" />
                <input
                  className="flex-1 text-sm outline-0"
                  placeholder="Search Participants... (Use ↑↓ to navigate, Enter to select)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {members.length == 0 ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <span className="text-muted-foreground text-center text-xs">
                    No participants found matching {'"'}
                    {search}
                    {'"'}
                  </span>
                </div>
              ) : (
                members.map((member, index) => {
                  const isFocused = focusedIndex == index;
                  return (
                    <Button
                      key={member.id}
                      ref={(el) => {
                        buttonRefs.current[index] = el;
                      }}
                      variant="link"
                      className={cn(
                        "text-foreground/50 justify-start",
                        isFocused && "ring-primary bg-accent ring-2",
                      )}
                      onClick={() => handleMemberClick(member)}
                    >
                      {member.firstName} {member.lastName}
                    </Button>
                  );
                })
              )}
            </div>
          </ResponsivePopoverBody>
        </ResponsivePopoverContent>
      </ResponsivePopover>
      <Button
        variant="link"
        className="text-foreground/50 px-0"
        href="/app"
        suppressHydrationWarning
      >
        Continue as {defaultMember?.firstName ?? "Guest"} <ArrowRight />
      </Button>
    </div>
  );
}
