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
import {
  ArrowLeft,
  CalendarIcon,
  Camera,
  CircleAlert,
  Info,
  Loader,
  QrCode,
  Check,
  Shuffle,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  action,
  type SafeEvents,
  type Members,
  verifyCode,
} from "./page.action";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { cn, getPointConfig } from "@/lib/utils";
import { QrScanner } from "@/components/ui/qr-scanner";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";

export function EventSubmissionClientPage({
  searchParams,
  members,
  events,
  memberId,
}: {
  searchParams: Record<string, string | undefined>;
  members: Members;
  events: SafeEvents;
  memberId?: string | undefined;
}) {
  const [request, setRequest] = useState({
    id: crypto.randomUUID(),
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
  const [additionalMemberIds, setAdditionalMemberIds] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [submissionType, setSubmissionType] = useState<"photo" | "qr">("photo");
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [draggingOver, serDragging] = useState(false);

  const verifyDebounce = useRef<NodeJS.Timeout | null>(null);

  const populateData = (params: URLSearchParams) => {
    setRequest((prev) => ({
      ...prev,
      eventId: params.get("eventId") ?? prev.eventId ?? "",
      description: params.get("description") ?? prev.description ?? "",
      type: params.get("type") ?? prev.type ?? getPointConfig()[0]?.id,
      eventDate: new Date(params.get("eventDate") ?? new Date().toISOString()),
    }));
    setCode(params.get("code") ?? "");
    setSubmissionType(params.get("code") == undefined ? "photo" : "qr");
  };

  useEffect(() => {
    setIsMounted(true);
    populateData(new URLSearchParams(searchParams as Record<string, string>));

    let overTimeout: NodeJS.Timeout | null = null;

    const dragoverListener = (evt: DragEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      serDragging(true);
      if (overTimeout) clearTimeout(overTimeout);
      overTimeout = setTimeout(() => {
        serDragging(false);
        evt.dataTransfer!.dropEffect = "none";
      }, 100);
      if (evt.dataTransfer?.items) {
        for (const item of evt.dataTransfer.items) {
          if (item.kind == "file") {
            const file = item.getAsFile();
            if (file?.type?.startsWith("image/")) {
              evt.dataTransfer.dropEffect = "copy";
              return;
            }
          }
        }
      }
    };

    const dropListener = (evt: DragEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      serDragging(false);
      if (evt.dataTransfer?.files && evt.dataTransfer.files.length > 0) {
        const file = evt.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          setFileUpload(file);
          setRequest((prev) => ({
            ...prev,
            upload_link: URL.createObjectURL(file),
          }));
        }
      }
      evt.dataTransfer!.clearData();
    };

    const dragendListener = (evt: DragEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      serDragging(false);
      evt.dataTransfer!.clearData();
    };

    document.addEventListener("dragover", dragoverListener);
    document.addEventListener("drop", dropListener);
    document.addEventListener("dragend", dragendListener);

    return () => {
      document.removeEventListener("dragover", dragoverListener);
      document.removeEventListener("drop", dropListener);
      document.removeEventListener("dragend", dragendListener);
    };
  }, [searchParams]);

  useEffect(() => {
    if (request.eventId) {
      const event = events.find((e) => e.id == request.eventId);
      if (event) {
        setRequest((prev) => ({
          ...prev,
          type: event.type ?? prev.type ?? getPointConfig()[0]?.id,
          eventDate: new Date(event.date ?? prev.eventDate ?? new Date()),
        }));
        setSubmissionType(
          event.hasQrSubmission && !fileUpload ? "qr" : "photo",
        );
      }
    }
  }, [events, fileUpload, request.eventId]);

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
        .catch(console.error);
    }, 1000);
  }, [code, request.eventId]);

  useEffect(() => {
    if (!fileInputRef.current) return;
    const dataTransfer = new DataTransfer();
    if (fileUpload && fileUpload instanceof File && fileUpload.size > 0) {
      dataTransfer.items.add(fileUpload);
    }
    fileInputRef.current.files = dataTransfer.files;
  }, [fileUpload]);

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
        <span className="flex items-center gap-2">Event Submission</span>
        <SaveButton
          disabled={(() => {
            if (!request.eventId) return true;
            if (!request.memberId) return true;
            if (!request.eventDate) return true;
            if (
              (events.find((e) => e.id == request.eventId)
                ?.needsAdditionalInfo ??
                true) &&
              !request.description
            )
              return true;
            if (submissionType == "photo" && !fileUpload) return true;
            if (
              submissionType == "qr" &&
              !(
                events.find((e) => e.id == request.eventId)?.hasQrSubmission ??
                false
              )
            )
              return true;
            if (submissionType == "qr" && code == "") return true;
            return false;
          })()}
        />
      </div>
      <input type="hidden" name="request" value={JSON.stringify(request)} />
      <input type="hidden" name="code" value={code} />
      <input
        type="hidden"
        name="additionalMemberIds"
        value={JSON.stringify(additionalMemberIds)}
      />
      <input type="file" name="file" ref={fileInputRef} className="hidden" />
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
        {Number(process.env.NEXT_PUBLIC_PARTICIPANT_MAX ?? "0") != 0 && (
          <>
            {additionalMemberIds.map((id, idx) => (
              <label key={id} className="flex w-full flex-col gap-2">
                <div className="flex items-center">
                  <span className="text-muted-foreground text-sm">
                    Participant Name
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="ml-auto !p-0 text-xs text-red-500"
                    onClick={() =>
                      setAdditionalMemberIds((prev) =>
                        prev.filter((_, i) => i != idx),
                      )
                    }
                  >
                    Remove Participant
                  </Button>
                </div>
                <Combobox
                  value={id}
                  onSelect={(val) =>
                    setAdditionalMemberIds((prev) => {
                      const newArr = [...prev];
                      newArr[idx] = val;
                      return newArr;
                    })
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
            ))}
            <label className="mb-4 flex items-center">
              <p className="text-muted-foreground text-xs">
                If you participated with others, and they are photographed in
                the submission, you may add them as participants. (
                {8 - additionalMemberIds.length} remaining)
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-auto shrink-0 text-xs"
                onClick={() => {
                  setAdditionalMemberIds((prev) => [...prev, ""]);
                }}
                disabled={
                  additionalMemberIds.length >=
                  Number(process.env.NEXT_PUBLIC_PARTICIPANT_MAX ?? "0")
                }
              >
                Add Participant
              </Button>
            </label>
          </>
        )}
        <label className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Event Name</span>
          <Combobox
            value={request.eventId}
            onSelect={(val) =>
              setRequest((prev) => ({ ...prev, eventId: val }))
            }
            groups={
              getPointConfig()?.map((pt) => ({
                header: `${pt.name.charAt(0).toUpperCase() + pt.name.slice(1)} Events`,
                id: pt.id,
                values: events
                  .filter((e) => e.type == pt.id)
                  .map((e) => ({
                    id: e.id,
                    render: e.name,
                  })),
              })) ?? []
            }
            allowCustomOption
            customOptionLabel={(opt) => `Create "${opt}"`}
            className="w-full"
            placeholders={{
              emptyValue: "Select an event...",
              search: "Start typing to search or create a custom event...",
            }}
          />
        </label>
        {!request.eventId && (
          <div className="flex h-9 items-center justify-start gap-2 rounded-md border border-yellow-500 bg-yellow-950 px-3 text-sm text-yellow-500">
            <CircleAlert className="size-4" />
            <span>Please select an event to continue.</span>
          </div>
        )}
        {events.find((e) => e.id == request.eventId)?.notes && (
          <div className="flex h-9 items-center justify-start gap-2 rounded-md border border-blue-500 bg-blue-950 px-3 text-sm text-blue-500">
            <Info className="size-4" />
            <span>{events.find((e) => e.id == request.eventId)?.notes}</span>
          </div>
        )}
        <div className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Event Type</span>
          <div className="flex w-full gap-2">
            {getPointConfig().map((pt) => (
              <Button
                key={pt.id}
                type="button"
                variant={request.type == pt.id ? "default" : "outline"}
                className="flex h-36 w-full flex-col items-start justify-end gap-2 rounded-xl border"
                onClick={() => setRequest((prev) => ({ ...prev, type: pt.id }))}
                disabled={!request.eventId}
              >
                <pt.Icon className="size-10" />
                <span className="text-lg font-bold">{pt.name}</span>
              </Button>
            ))}
          </div>
        </div>
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
        {(events.find((e) => e.id == request.eventId)?.needsAdditionalInfo ??
          true) && (
          <label className="flex w-full flex-col gap-2">
            <span className="text-muted-foreground text-sm">Description</span>
            <Textarea
              value={request.description}
              onChange={(evt) =>
                setRequest((prev) => ({
                  ...prev,
                  description: evt.target.value,
                }))
              }
              disabled={!request.eventId}
              placeholder="e.x. Mean Girls Musicial, PRMS Winter Concert, etc."
            />
          </label>
        )}
        <div className="flex w-full flex-col gap-2">
          <span className="text-muted-foreground text-sm">Submission Type</span>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant={submissionType == "photo" ? "default" : "outline"}
              className="flex h-36 w-full flex-col items-start justify-end gap-2 rounded-xl border"
              onClick={() => setSubmissionType("photo")}
              disabled={!request.eventId}
            >
              <Camera className="size-10" />
              <span className="text-lg font-bold">Photo</span>
            </Button>
            <Button
              type="button"
              variant={submissionType == "qr" ? "default" : "outline"}
              className="flex h-36 w-full flex-col items-start justify-end gap-2 rounded-xl border"
              onClick={() => setSubmissionType("qr")}
              disabled={
                !request.eventId ||
                !(
                  events.find((e) => e.id == request.eventId)
                    ?.hasQrSubmission ?? false
                )
              }
            >
              <QrCode className="size-10" />
              <span className="text-lg font-bold">Event Code</span>
            </Button>
          </div>
        </div>
        {isMounted &&
          createPortal(
            <div
              className={cn(
                "pointer-events-none fixed inset-0 z-10 grid place-items-center bg-black/20 opacity-0 backdrop-blur-sm",
                draggingOver && "opacity-100",
              )}
            >
              <div className="border-primary/30 bg-background w-[min(calc(100%-8rem),40rem)] rounded-xl border p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 font-bold">
                    <Upload /> Drop files to upload
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    Maximum of 2 MB files
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
        {(() => {
          switch (submissionType) {
            case "photo":
            default:
              return (
                <label className="group flex w-full flex-col gap-2">
                  <span className="text-muted-foreground text-sm">
                    Image Upload
                  </span>
                  {fileUpload ? (
                    <div className="flex cursor-pointer items-center gap-4 rounded-xl border p-2">
                      <img
                        src={URL.createObjectURL(fileUpload)}
                        alt="Uploaded file preview"
                        className="size-16 rounded-lg bg-black object-contain"
                      />
                      <div className="flex flex-col items-start gap-1">
                        <span>{fileUpload.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {(fileUpload.size / 1024).toFixed(2) + " KB"}
                        </span>
                      </div>
                      <div className="group-hover:bg-primary/50 bg-secondary mr-4 ml-auto flex size-9 items-center justify-center rounded-lg transition-colors">
                        <Shuffle className="size-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground flex h-36 cursor-pointer items-center justify-center gap-2 rounded-xl border text-xs">
                      <Upload /> Upload file or drag and drop here
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!request.eventId}
                    onChange={(evt) => {
                      const file = evt.target.files?.[0] ?? null;
                      if (file) {
                        setFileUpload(file);
                        setRequest((prev) => ({
                          ...prev,
                          upload_link: URL.createObjectURL(file),
                        }));
                      }
                    }}
                  />
                </label>
              );
            case "qr":
              return (
                <label className="group flex w-full flex-col gap-2">
                  <span className="text-muted-foreground text-sm">
                    Event Code
                  </span>
                  <div className="flex gap-2 rounded-xl border p-4">
                    {qrReader}
                    <div className="flex w-full flex-col gap-2">
                      <h2 className="font-bold">Enter Event Code or Scan QR</h2>
                      <p className="text-muted-foreground text-xs">
                        If you have a QR code, scan it with your camera or enter
                        the code manually.
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
              );
          }
        })()}
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
