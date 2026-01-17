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
import { ArrowLeft, CalendarIcon, Loader, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  action,
  type SafeEvents,
  type Members,
  verifyCode,
} from "./page.action";
import { Combobox } from "@/components/ui/combobox";
import { QrScanner } from "@/components/ui/qr-scanner";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { getPointConfig } from "@/lib/utils";

export function EventSubmissionClientPage({
  searchParams,
  members,
  memberId,
}: {
  searchParams: Record<string, string | undefined>;
  members: Members;
  events: SafeEvents;
  memberId?: string | undefined;
}) {
  const [request, setRequest] = useState({
    id: "",
    eventId: "",
    description: "",
    type: getPointConfig()[0]?.id,
    officer_notes: "",
    upload_link: "",
    status: "pending",
    eventDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    memberId: memberId ?? "",
  });
  const [code, setCode] = useState("");
  const verifyDebounce = useRef<NodeJS.Timeout | null>(null);

  const populateData = (params: URLSearchParams) => {
    setRequest((prev) => ({
      ...prev,
      id: new Date(prev.eventDate ?? new Date()).toISOString().split("T")[0],
      eventId: params.get("eventId") ?? prev.eventId ?? "",
      description: params.get("description") ?? prev.description ?? "",
      type: params.get("type") ?? prev.type ?? getPointConfig()[0]?.id,
      eventDate: new Date(
        params.get("eventDate") ?? prev.eventDate ?? new Date().toISOString(),
      ),
    }));
    setCode(params.get("code") ?? "");
  };

  useEffect(() => {
    setRequest((prev) => ({
      ...prev,
      eventId: new Date(prev.eventDate ?? new Date())
        .toISOString()
        .split("T")[0],
    }));
  }, [request.eventDate]);

  useEffect(() => {
    populateData(new URLSearchParams(searchParams as Record<string, string>));
  }, [searchParams]);

  useEffect(() => {
    if (!code) return;
    if (verifyDebounce.current) clearTimeout(verifyDebounce.current);
    toast.loading("Verifying event code....", {
      id: "qr-verify",
    });
    verifyDebounce.current = setTimeout(() => {
      verifyCode({
        id: request.eventId,
        code: code,
      })
        .then((success) => {
          if (success) {
            toast.success("Event Code verified successfully!", {
              id: "qr-verify",
            });
          } else {
            toast.error("Invalid event code.", {
              id: "qr-verify",
            });
          }
        })
        .catch(() => console.error("Failed to verify code"));
    }, 1000);
  }, [code, request.eventId]);

  const qrReader = useMemo(
    () => (
      <QrScanner
        className="size-32 rounded-lg"
        onResult={(val) => {
          populateData(new URL(val.data).searchParams);
        }}
      />
    ),
    [],
  );

  return (
    <form action={action} className="relative flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          href="/app"
          className="size-12 border-2"
        >
          <ArrowLeft />
        </Button>
        <span className="flex items-center gap-2">Attendance Submission</span>
        <SaveButton
          disabled={(() => {
            if (!request.eventId) return true;
            if (!request.memberId) return true;
            if (!request.eventDate) return true;
            if (code == "") return true;
          })()}
        />
      </div>
      <input type="hidden" name="request" value={JSON.stringify(request)} />
      <input type="hidden" name="code" value={code} />
      <div className="flex flex-col gap-4">
        <label className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Your Name</span>
          <Combobox
            value={request.memberId}
            onSelect={(val) =>
              setRequest((prev) => ({ ...prev, memberId: val }))
            }
            groups={[
              {
                header: "Members",
                id: "members",
                values: members
                  .filter((m) => m.role != "participant")
                  .map((m) => ({
                    id: m.id,
                    render: `${m.firstName} ${m.lastName}`,
                  })),
              },
              {
                header: "Participants",
                id: "participants",
                values: members
                  .filter((m) => m.role == "participant")
                  .map((m) => ({
                    id: m.id,
                    render: `${m.firstName} ${m.lastName}`,
                  })),
              },
            ]}
            className="w-full"
          />
        </label>
        <div className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Event Date</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                data-empty={!request.eventDate}
                className="data-[empty=true]:text-muted-foreground h-9 flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon />
                {request.eventDate ? (
                  new Date(request.eventDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-background w-auto p-0">
              <Calendar
                mode="single"
                fixedWeeks
                selected={request.eventDate ?? undefined}
                onSelect={(val) => {
                  if (!val) return;
                  setRequest((prev) => ({
                    ...prev,
                    eventDate: new Date(val),
                  }));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <label className="group flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Event Code</span>
          <div className="flex gap-2 rounded-xl border p-4">
            {qrReader}
            <div className="flex w-full flex-col gap-2">
              <h2 className="font-bold">Enter Event Code or Scan QR</h2>
              <p className="text-muted-foreground text-xs">
                If you have a QR code, scan it with your camera or enter the
                code manually.
              </p>
              <Input
                value={code}
                onChange={(evt) => setCode(evt.target.value)}
                placeholder="Scan or enter QR code"
                className="mt-auto font-mono"
              />
            </div>
          </div>
        </label>
      </div>
    </form>
  );
}

function SaveButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const router = useRouter();

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      setTimeout(() => {
        firstRender.current = false;
      }, 100);
      return;
    }
    if (pending) {
      toast.loading("Submitting...", { id: "submit-event" });
    } else {
      toast.success("Submitted!", { id: "submit-event" });
      router.push("/app");
    }
  }, [pending, router]);

  return (
    <Button
      type="submit"
      className="border-primary size-12 border-2"
      disabled={disabled! || pending}
    >
      {pending ? <Loader className="animate-spin" /> : <Check />}
    </Button>
  );
}
