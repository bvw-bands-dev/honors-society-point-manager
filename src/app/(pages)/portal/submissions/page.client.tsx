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

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  // CheckCheck,
  CircleCheck,
  Dot,
  ExternalLink,
  Image,
  // ListChecks,
  Loader,
  Minus,
  Save,
  Slash,
  Text,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  action,
  type Events,
  type Members,
  type Submissions,
} from "./page.action";
import { useFormStatus } from "react-dom";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
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
  ResponsivePopoverClose,
  ResponsivePopoverContent,
  ResponsivePopoverDescription,
  ResponsivePopoverHeader,
  ResponsivePopoverTitle,
  ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import { cn, getPointConfig } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SubmissionsClientPage({
  members,
  self,
  events,
  submissions: defaultSubmisisons,
  searchParams,
}: {
  members: Members;
  self: Members[number];
  events: Events;
  submissions: Submissions;
  searchParams: Record<string, string | undefined>;
}) {
  const [view, _setView] = useState<"single" | "list">(
    (searchParams.view ?? "list") == "list" ? "list" : "single",
  );
  const [submissions, setSubmissions] = useState(defaultSubmisisons);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url.toString());
  }, [view]);

  return (
    <form action={action} className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            href="/portal"
            className="size-12 border-2"
          >
            <ArrowLeft />
          </Button>
        </div>
        <span className="flex items-center gap-2">
          <span className="hidden items-center gap-2 md:flex">
            Officer Portal <Slash className="size-3" />
          </span>{" "}
          Submissions
        </span>
        <div className="flex items-center gap-2">
          {/*<Button
            variant="secondary"
            className="size-12 border-2"
            onClick={() => {
              setView((v) => (v == "single" ? "list" : "single"));
            }}
          >
            {view == "single" ? <ListChecks /> : <CheckCheck />}
          </Button>*/}
          <SaveButton
            disabled={(() => {
              return false;
            })()}
          />
        </div>
      </div>
      <div className="flex max-w-full flex-col gap-6 overflow-hidden md:gap-2">
        <input
          type="hidden"
          name="submissions"
          value={JSON.stringify(submissions)}
        />
        {view == "single" ? (
          <SingleUI
            members={members}
            self={self}
            events={events}
            defaultSubmisisons={defaultSubmisisons}
            submissions={submissions}
            setSubmissions={setSubmissions}
          />
        ) : (
          <ListUI
            members={members}
            self={self}
            events={events}
            defaultSubmisisons={defaultSubmisisons}
            submissions={submissions}
            setSubmissions={setSubmissions}
          />
        )}
      </div>
    </form>
  );
}

function SingleUI({
  members,
  events,
  submissions,
  setSubmissions,
}: {
  members: Members;
  self: Members[number];
  events: Events;
  defaultSubmisisons: Submissions;
  submissions: Submissions;
  setSubmissions: Dispatch<SetStateAction<Submissions>>;
}) {
  const [isActive, setIsActive] = useState(false);
  const [posX, setPosX] = useState(0);
  const [deletingPos, setDeletingPos] = useState(0);
  const [deleteModal, setDeleteModal] = useState(false);
  const [touch, setTouch] = useState(false);
  const [override, setOverride] = useState(false);
  const isDeleting = useRef<boolean | "pending">("pending");
  const releaseDebounce = useRef<NodeJS.Timer | null>(null);
  const lastMovedId = useRef<string | null>(null);
  const lastPosX = useRef<number | null>(null);
  const runningAnimation = useRef(false);

  const move = useCallback(
    (pos: number) => {
      if (runningAnimation.current) return;
      runningAnimation.current = true;
      setIsActive(false);
      if (releaseDebounce.current) clearInterval(releaseDebounce.current);

      const startTime = Date.now();
      const duration = 1000;
      const startPos = posX;
      const targetPos = pos;
      const distance = targetPos - startPos;

      const easeInOut = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOut(progress);

        const currentPos = startPos + distance * easedProgress;
        setPosX(currentPos);

        if (progress >= 1) {
          clearInterval(interval);
          runningAnimation.current = false;
          setOverride(true);
        }
      }, 16); // ~60fps
    },
    [posX],
  );

  useEffect(() => {
    if (runningAnimation.current) return;
    if (Math.abs(posX) <= 0.1 && posX != 0) {
      setPosX(0);
    }
  }, [posX]);

  useEffect(() => {
    const mouseup = async (evt: MouseEvent | TouchEvent | null) => {
      if (runningAnimation.current) return;
      const touch = evt?.type.startsWith("touch");
      lastPosX.current = null;
      if (
        !deleteModal &&
        !override &&
        ((touch ? false : !isActive) || deletingPos != 0)
      )
        return;

      setIsActive(false);
      setOverride(false);

      if (deleteModal) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (isDeleting.current == "pending") return;
        setDeleteModal(false);
        if (!isDeleting.current) {
          isDeleting.current = "pending";
          return;
        } else {
          isDeleting.current = "pending";
        }
      }

      if (Math.abs(posX) >= 100) {
        const submission = submissions.find((s) => s.status == "pending")!;

        const wasApproved = posX > 0;

        if (!wasApproved && !deleteModal) {
          setDeleteModal(true);
          return;
        }

        runningAnimation.current = true;
        if (wasApproved && !override) {
          toast.success(`Submission marked as approved!`, {
            id: "action-marked",
            action: {
              label: "Undo",
              onClick: () => {
                setTimeout(() => {
                  setSubmissions((subs) =>
                    subs.map((sub) =>
                      sub.id == submission.id
                        ? { ...sub, status: "pending" }
                        : sub,
                    ),
                  );
                  setDeletingPos(0);
                  setPosX(0);
                  lastMovedId.current = null;
                }, 1000);
              },
            },
          });
        } else {
          toast.error(`Submission marked as rejected!`, {
            id: "action-marked",
            action: {
              label: "Undo",
              onClick: () => {
                setTimeout(() => {
                  setSubmissions((subs) =>
                    subs.map((sub) =>
                      sub.id == submission.id
                        ? { ...sub, status: "pending" }
                        : sub,
                    ),
                  );
                  setDeletingPos(0);
                  setPosX(0);
                  lastMovedId.current = null;
                }, 1000);
              },
            },
          });
        }

        setDeletingPos(0);
        setTimeout(() => {
          clearInterval(releaseDebounce.current!);
          setDeletingPos(0);
          setPosX(0);
          lastMovedId.current = submission.id;
          if (wasApproved) {
            setSubmissions((subs) =>
              subs.map((sub) =>
                sub.id == submission.id ? { ...sub, status: "approved" } : sub,
              ),
            );
          } else {
            setSubmissions((subs) =>
              subs.map((sub) =>
                sub.id == submission.id ? { ...sub, status: "rejected" } : sub,
              ),
            );
          }
          runningAnimation.current = false;
        }, 1000);

        releaseDebounce.current = setInterval(() => {
          setDeletingPos((prev) => prev + 2);
        }, 1);

        return;
      }

      releaseDebounce.current = setInterval(() => {
        if (posX == 0) {
          clearInterval(releaseDebounce.current!);
        } else {
          setPosX(
            (prev) =>
              prev - Math.sign(prev) * Math.max(0.1, Math.abs(prev) / 50),
          );
        }
      }, 1);
    };

    const mousemove = (evt: MouseEvent | TouchEvent) => {
      if (deleteModal || runningAnimation.current) return;
      const touch = evt.type.startsWith("touch");
      if (touch) {
        setTouch(true);
        setTimeout(() => {
          setTouch(true);
        }, 100);
      } else {
        setTouch(false);
      }
      if ((touch ? false : !isActive) || deletingPos != 0) return;
      if (releaseDebounce.current) clearInterval(releaseDebounce.current);
      if (submissions.filter((s) => s.status == "pending").length == 0) return;
      const currentX = evt.type.startsWith("touch")
        ? (evt as TouchEvent).touches?.[0]?.pageX
        : (evt as MouseEvent).clientX;
      const x = currentX - (lastPosX.current ?? currentX);
      setPosX((prev) => prev + x);
      lastPosX.current = currentX;
    };

    const keypress = (evt: KeyboardEvent) => {
      if (runningAnimation.current) return;

      function isMacOS() {
        return (
          navigator.userAgent.includes("Macintosh") ||
          navigator.userAgent.includes("Mac OS X")
        );
      }

      if (deleteModal) {
        if ((isMacOS() ? evt.metaKey : evt.ctrlKey) && evt.key == "Enter") {
          isDeleting.current = true;
          mouseup(null).catch(console.error);
        } else if (evt.key == "Escape") {
          isDeleting.current = false;
          mouseup(null).catch(console.error);
          setTimeout(() => move(0), 100);
        }
        return;
      }

      if (evt.key == "ArrowLeft") {
        move(-100);
      } else if (evt.key == "ArrowRight") {
        move(100);
      } else if (
        evt.key == "u" ||
        ((isMacOS() ? evt.metaKey : evt.ctrlKey) && evt.key == "z")
      ) {
        if (lastMovedId.current) {
          setSubmissions((subs) =>
            subs.map((sub) =>
              sub.id == lastMovedId.current
                ? { ...sub, status: "pending" }
                : sub,
            ),
          );
          setDeletingPos(0);
          setPosX(0);
          lastMovedId.current = null;
          toast.success("Submission reverted to pending.");
        } else {
          toast.error("No submission to revert.");
        }
      }
    };

    if (override) {
      mouseup(null).catch(console.error);
    }

    document.body.addEventListener("mousedown", mousemove);
    document.body.addEventListener("touchstart", mousemove);
    document.body.addEventListener("mousemove", mousemove);
    document.body.addEventListener("touchmove", mousemove);
    document.body.addEventListener("mouseup", () => {
      mouseup(null).catch(console.error);
    });
    document.body.addEventListener("touchend", () => {
      mouseup(null).catch(console.error);
    });
    document.body.addEventListener("keydown", keypress);

    return () => {
      document.body.removeEventListener("mousedown", mousemove);
      document.body.removeEventListener("touchstart", mousemove);
      document.body.removeEventListener("mousemove", mousemove);
      document.body.removeEventListener("touchmove", mousemove);
      document.body.removeEventListener("mouseup", () => {
        mouseup(null).catch(console.error);
      });
      document.body.removeEventListener("touchend", () => {
        mouseup(null).catch(console.error);
      });
      document.body.removeEventListener("keydown", keypress);
    };
  }, [
    isActive,
    posX,
    submissions,
    setSubmissions,
    override,
    deleteModal,
    deletingPos,
    move,
  ]);

  function Card({
    children,
    className,
    isActive,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    isActive?: boolean;
    key?: string;
    id?: string;
  }) {
    return (
      <div
        {...props}
        className={cn(
          "bg-background flex aspect-[9/16] min-h-0 w-[min(80vw,40vh,25rem)] flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-[filter] select-none",
          className,
        )}
        onMouseDown={(evt) => {
          if (evt.button != 0) return;
          setIsActive(true);
        }}
        style={{
          ...props.style,
          transition: !isActive ? "all 0.4s" : "",
        }}
        key={props.key}
      >
        {children}
      </div>
    );
  }

  const stopPropagation = {
    onMouseDown: (evt: MouseEvent) => {
      evt.stopPropagation();
    },
    onMouseMove: (evt: MouseEvent) => {
      evt.stopPropagation();
    },
    onMouseUp: (evt: MouseEvent) => {
      evt.stopPropagation();
    },
    onTouchStart: (evt: TouchEvent) => {
      evt.stopPropagation();
    },
    onTouchMove: (evt: TouchEvent) => {
      evt.stopPropagation();
    },
    onTouchEnd: (evt: TouchEvent) => {
      evt.stopPropagation();
    },
  } as unknown as React.HTMLAttributes<HTMLButtonElement>;

  function softClamp(
    value = 0,
    softMin = 0,
    softMax = 0,
    hardMin = softMin * 2,
    hardMax = softMax * 2,
    stickyFactor = 0.2,
  ) {
    let result = value;

    if (result > softMax) {
      const excess = result - softMax;
      result = softMax + excess * stickyFactor;
    } else if (result < softMin) {
      const excess = result - softMin;
      result = softMin + excess * stickyFactor;
    }

    return Math.min(hardMax, Math.max(hardMin, result));
  }

  function EntryCard({
    submission,
    className,
    isActive,
    ...props
  }: {
    submission: Submissions[number];
    className?: string;
    style?: React.CSSProperties;
    isActive?: boolean;
    key?: string;
    id?: string;
  }) {
    return (
      <Card
        {...props}
        className={cn(
          "@container flex flex-col items-center justify-center gap-4 overflow-hidden",
          className,
        )}
        style={{
          ...props.style,
          transform: isActive
            ? `${props.style?.transform} translateX(${softClamp(posX, -100, 100, -200, 200, 0.1)}px) rotate(${0.05 * softClamp(posX, -100, 100, -200, 200, 0.1)}deg)`
            : props.style?.transform,
          opacity: isActive ? `${100 - deletingPos}%` : 1,
          scale: isActive
            ? `${(1 - Math.abs(softClamp(posX, -100, 100, -200, 200, 0.1)) / 1000) * (1 - deletingPos / 100)}`
            : 1,
        }}
        isActive={isActive}
      >
        {submission.uploadLink && (
          <img
            src={`/uploads/${submission.uploadLink}`}
            alt="Submission"
            className="bg-background pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-30 blur-3xl select-none"
          />
        )}
        {submission.uploadLink ? (
          <div className="relative h-full w-full flex-1 overflow-hidden">
            <img
              src={`/uploads/${submission.uploadLink}`}
              alt="Submission"
              className="pointer-events-none h-full w-full rounded-md border bg-black object-cover select-none"
            />
            <Button
              {...stopPropagation}
              href={`/uploads/${submission.uploadLink}`}
              onClick={(evt) => {
                evt.preventDefault();
                window.open(
                  `/uploads/${submission.uploadLink}`,
                  "upload",
                  "width=800,height=600,scrollbars=yes,resizable=yes",
                );
              }}
              className="pointer-events-all absolute top-2 right-2 h-8 rounded-sm"
              variant="secondary"
            >
              Open Image <ExternalLink />
            </Button>
          </div>
        ) : (
          <div className="bg-secondary/30 relative grid h-full w-full flex-1 place-items-center overflow-hidden rounded-md border">
            <Image className="stroke-primary size-24 opacity-50" />
          </div>
        )}
        <div className="pointer-events-auto flex h-full w-full flex-1 shrink-0 flex-col items-start justify-end gap-2">
          <h2 className="text-2xl font-bold">
            {members.find((m) => m.id == submission.memberId)?.firstName}{" "}
            {members.find((m) => m.id == submission.memberId)?.lastName}
          </h2>
          <span className="text-muted-foreground text-sm">
            {events.find((e) => e.id == submission.eventId)?.name ??
              submission.eventId}{" "}
            on{" "}
            {new Date(submission.eventDate ?? "").toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              },
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            Submitted{" "}
            {new Date(submission.createdAt ?? "").toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </span>
          <div className="bg-secondary/20 min-h-[4rem] w-full rounded-md">
            {submission.description ? (
              <p className="p-2 text-sm whitespace-pre-line">
                {submission.description}
              </p>
            ) : (
              <p className="text-muted-foreground p-2 text-sm italic">
                No description provided.
              </p>
            )}
          </div>
          <div className="flex w-full items-center gap-2">
            <Button
              {...stopPropagation}
              variant="ghost"
              size="icon"
              className="h-12 bg-red-800 hover:bg-red-900"
              style={{
                width: isActive ? `${Math.max(0, 0.5 * -posX + 50)}%` : "50%",
                marginRight: isActive
                  ? `${Math.max(-0.5, Math.min(0, posX / 750))}rem`
                  : 0,
              }}
              onClick={() => {
                move(-100);
              }}
            >
              <span
                style={{
                  opacity: isActive
                    ? `${Math.max(0, Math.min(100, 5 * -posX + 100))}%`
                    : 1,
                }}
              >
                <X />
              </span>
            </Button>
            <Button
              {...stopPropagation}
              variant="ghost"
              size="icon"
              className="pointer-events-auto h-12 bg-green-800 hover:bg-green-900"
              style={{
                width: isActive ? `${Math.max(0, 0.5 * posX + 50)}%` : "50%",
                marginLeft: isActive
                  ? `${Math.max(-0.5, Math.min(0, -posX / 750))}rem`
                  : 0,
              }}
              onClick={() => {
                move(100);
              }}
            >
              <span
                style={{
                  opacity: isActive
                    ? `${Math.max(0, Math.min(100, 5 * posX + 100))}%`
                    : 1,
                }}
              >
                <Check />
              </span>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  function EmptyCard({
    className,
    ...props
  }: {
    className?: string;
    style?: React.CSSProperties;
    key?: string;
    id?: string;
  }) {
    return (
      <Card {...props} className={className}>
        <CircleCheck className="size-8" />
        <h2 className="text-2xl font-bold">All Clear!</h2>
        <p className="text-muted-foreground px-6 text-center text-xs">
          There are no more pending requests, check again later, or open list
          view to see all submissions.
        </p>
      </Card>
    );
  }

  const currentSubmission = useMemo(() => {
    return submissions
      .filter((s) => s.status == "pending")
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? new Date()).getTime() -
          new Date(b.createdAt ?? new Date()).getTime(),
      )[0];
  }, [submissions]);

  return (
    <>
      <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject{" "}
              {
                members.find((m) => m.id == currentSubmission?.memberId)
                  ?.firstName
              }
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please enter a reason for rejecting this submission. This will be
              sent to the member for feedback
            </AlertDialogDescription>
            <Textarea
              value={currentSubmission?.officerNotes ?? ""}
              onChange={(evt) =>
                setSubmissions(
                  submissions.map((sub) =>
                    sub.id == currentSubmission?.id
                      ? { ...sub, officerNotes: evt.target.value }
                      : sub,
                  ),
                )
              }
              autoFocus
              placeholder="Add any notes for the member here."
              className="w-full"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  isDeleting.current = false;
                  setTimeout(() => move(0), 100);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPosX(posX);
                  isDeleting.current = true;
                }}
                variant="destructive"
              >
                Reject
              </Button>
            </div>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
      <AnimatePresence>
        <div
          className="relative -mx-8 flex h-[calc(100vh-8rem)] w-[calc(100+theme(spacing.12))] flex-col items-center justify-center gap-4 overflow-hidden"
          data-no-scroll
        >
          {touch && (
            <div className="absolute inset-x-0 top-24 bottom-28 z-10 bg-blue-500/50" />
          )}
          <div className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
            {[
              ...submissions
                .filter((s) => s.status == "pending")
                .sort(
                  (a, b) =>
                    new Date(a.createdAt ?? new Date()).getTime() -
                    new Date(b.createdAt ?? new Date()).getTime(),
                )
                .map((s) => (
                  <EntryCard key={s.id} id={`card-${s.id}`} submission={s} />
                )),
              <EmptyCard key={"empty"} id={"card-empty"} />,
            ]
              .filter((_, i) => i < 3)
              .map(
                (
                  {
                    type: Component,
                    key,
                    props: props,
                  }: {
                    type: React.ElementType;
                    key: string | null;
                    props: React.ComponentPropsWithoutRef<React.ElementType> & {
                      style?: React.CSSProperties;
                    };
                  },
                  idx,
                ) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={key}
                    className="@container aspect-[9/16] min-h-0 w-[min(80vw,40vh,25rem)]"
                  >
                    <Component
                      {...props}
                      key={key}
                      isActive={idx == 0}
                      style={{
                        // eslint-disable-next-line react/prop-types
                        ...(props.style ?? {}),
                        position: "relative",
                        transform: `scale(${100 - 5 * Math.max(0, idx - softClamp(Math.abs(posX), -100, 100, -200, 200, 0.1) / 100)}%)`,
                        bottom: `${4 * Math.pow(Math.max(0, idx - softClamp(Math.abs(posX), -100, 100, -200, 200, 0.1) / 100), 1 / 1.2)}cqh`,
                        transition: "all 0.4s",
                      }}
                    />
                  </motion.div>
                ),
              )
              .toReversed()}
          </div>
        </div>
      </AnimatePresence>
    </>
  );
}

function ListUI({
  members,
  self,
  events,
  defaultSubmisisons,
  submissions,
  setSubmissions,
}: {
  members: Members;
  self: Members[number];
  events: Events;
  defaultSubmisisons: Submissions;
  submissions: Submissions;
  setSubmissions: Dispatch<SetStateAction<Submissions>>;
}) {
  // Helper to get member full name
  function getMemberName(memberId: string) {
    const member = members.find((m) => m.id == memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown Member";
  }

  // Helper to get event name
  function getEventName(eventId: string) {
    return (
      events.find((e) => e.id == eventId)?.name ?? eventId ?? "Unknown Event"
    );
  }

  // Helper to format date
  function formatDate(
    date: string | Date | null,
    opts?: Intl.DateTimeFormatOptions,
  ) {
    if (!date) return "";
    return new Date(date).toLocaleDateString(undefined, opts);
  }

  // Helper to check if submission has unsaved changes
  function hasUnsavedChanges(submission: Submissions[number]) {
    const defaultSub = defaultSubmisisons.find(
      (sub) => sub.id == submission.id,
    );
    return defaultSub && defaultSub.status != submission.status;
  }

  // Group submissions by status
  function groupSubmissions(submissions: Submissions) {
    const groups = {
      pending: [] as Submissions,
      approved_group: [] as Submissions,
      rejected: [] as Submissions,
    };
    for (const s of submissions) {
      if (s.status == "pending") {
        groups.pending.push(s);
      } else if (s.status == "auto-approved" || s.status == "approved") {
        groups.approved_group.push(s);
      } else if (s.status == "rejected") {
        groups.rejected.push(s);
      }
    }
    return groups;
  }

  // Sort submissions in each group by createdAt
  function sortGroups(groups: Record<string, Submissions>) {
    Object.values(groups).forEach((group) =>
      group.sort(
        (a, b) =>
          new Date(a.createdAt ?? new Date()).getTime() -
          new Date(b.createdAt ?? new Date()).getTime(),
      ),
    );
  }

  // Constants for status labels and order
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    approved_group: "Approved",
    rejected: "Rejected",
  };
  const statusOrder = ["pending", "approved_group", "rejected"] as const;

  // Filter out cancelled submissions
  const filteredSubmissions = submissions.filter(
    (s) => s.status != "cancelled",
  );

  // Group and sort submissions
  const grouped = groupSubmissions(filteredSubmissions);
  sortGroups(grouped);

  return (
    <div className="flex max-w-full flex-col gap-4">
      {statusOrder.map((status) =>
        grouped[status].length > 0 ? (
          <div key={status} className="mb-6">
            <div className="text-muted-foreground mt-4 mb-2 text-sm font-semibold tracking-wider">
              {statusLabels[status].toUpperCase()}
            </div>
            <div className="flex flex-col gap-2 overflow-auto">
              {grouped[status].map((submission) => {
                const isPending = submission.status == "pending";
                const isApproved =
                  submission.status == "approved" ||
                  submission.status == "auto-approved";
                const isRejected = submission.status == "rejected";
                const defaultStatus = defaultSubmisisons.find(
                  (sub) => sub.id == submission.id,
                )?.status;

                return (
                  <div
                    key={submission.id}
                    className="bg-background/40 flex min-w-[80ch] justify-between gap-2 rounded-lg border p-4"
                  >
                    {/* Submission Info */}
                    <div className="flex flex-col gap-1">
                      <h2 className="font-bold">
                        {getMemberName(submission.memberId)}
                      </h2>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <h3>
                          {getEventName(submission.eventId)} on{" "}
                          {formatDate(submission.eventDate, {
                            month: "short",
                            day: "numeric",
                          })}
                        </h3>
                        <Dot className="size-3" />
                        <span className="text-xs">
                          Submitted{" "}
                          {formatDate(submission.createdAt, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Type Badge */}
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
                        {/* Status Badge */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                            isApproved && "border-green-600 bg-green-800",
                            isRejected && "border-red-600 bg-red-800",
                            isPending && "border-yellow-600 bg-yellow-800",
                            submission.status == "cancelled" &&
                              "border-gray-600 bg-gray-800",
                          )}
                        >
                          <div
                            className={cn(
                              "size-3 rounded-full",
                              isApproved && "bg-green-600",
                              isRejected && "bg-red-600",
                              isPending && "bg-yellow-600",
                              submission.status == "cancelled" && "bg-gray-600",
                            )}
                          />
                          {toProperCase(submission.status)}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {submission.officerNotes}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      {/* Unsaved Changes Indicator */}
                      {hasUnsavedChanges(submission) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="mr-2 grid size-6 place-items-center rounded-full border-yellow-500 bg-yellow-800">
                              <TriangleAlert className="size-3 stroke-yellow-500 stroke-3" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Changes not saved yet!
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Description Popover */}
                      <ResponsivePopover>
                        <ResponsivePopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-12"
                            disabled={
                              submission.description == undefined ||
                              submission.description.trim() == ""
                            }
                          >
                            <Text />
                          </Button>
                        </ResponsivePopoverTrigger>
                        <ResponsivePopoverContent popoverClassName="w-[40ch]">
                          <ResponsivePopoverHeader>
                            <ResponsivePopoverTitle>
                              Submission Description
                            </ResponsivePopoverTitle>
                            <ResponsivePopoverDescription>
                              Additional details provided by the member.
                            </ResponsivePopoverDescription>
                          </ResponsivePopoverHeader>
                          <ResponsivePopoverBody>
                            <div className="text-sm whitespace-pre-line">
                              {submission.description ?? (
                                <span className="text-muted-foreground italic">
                                  No description provided.
                                </span>
                              )}
                            </div>
                          </ResponsivePopoverBody>
                        </ResponsivePopoverContent>
                      </ResponsivePopover>

                      {/* Image Popover */}
                      <ResponsivePopover>
                        <ResponsivePopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-12"
                            disabled={
                              !submission.uploadLink ||
                              submission.uploadLink.trim() == ""
                            }
                          >
                            <Image />
                          </Button>
                        </ResponsivePopoverTrigger>
                        <ResponsivePopoverContent>
                          <ResponsivePopoverHeader>
                            <ResponsivePopoverTitle>
                              Submission Image
                            </ResponsivePopoverTitle>
                            <ResponsivePopoverDescription>
                              Image provided by the member.
                            </ResponsivePopoverDescription>
                          </ResponsivePopoverHeader>
                          <ResponsivePopoverBody>
                            {submission.uploadLink ? (
                              <img
                                src={`/uploads/${submission.uploadLink}`}
                                alt="Submission"
                                className="size-80 rounded border bg-black object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground italic">
                                No image provided.
                              </span>
                            )}
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                href={`/uploads/${submission.uploadLink}`}
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  window.open(
                                    `/uploads/${submission.uploadLink}`,
                                    "upload",
                                    "width=800,height=600,scrollbars=yes,resizable=yes",
                                  );
                                }}
                              >
                                Open <ExternalLink />
                              </Button>
                            </div>
                          </ResponsivePopoverBody>
                        </ResponsivePopoverContent>
                      </ResponsivePopover>

                      <ResponsivePopover>
                        <ResponsivePopoverTrigger asChild>
                          <Button
                            size="icon"
                            className={cn(
                              "size-12",
                              defaultStatus == "pending" && isRejected
                                ? "bg-gray-800 hover:bg-gray-900"
                                : "bg-red-800 hover:bg-red-900",
                            )}
                            disabled={
                              self.role != "owner" &&
                              self.role != "staff" &&
                              defaultStatus != "pending"
                            }
                            onClick={
                              defaultStatus == "pending" && isRejected
                                ? () => {
                                    // Set back to pending/default
                                    setSubmissions((subs) =>
                                      subs.map((sub) =>
                                        sub.id == submission.id
                                          ? { ...sub, status: "pending" }
                                          : sub,
                                      ),
                                    );
                                  }
                                : undefined
                            }
                          >
                            {defaultStatus == "pending" && isRejected ? (
                              <Minus />
                            ) : (
                              <X />
                            )}
                          </Button>
                        </ResponsivePopoverTrigger>
                        {!isRejected && (
                          <ResponsivePopoverContent popoverClassName="w-[40ch]">
                            <ResponsivePopoverHeader>
                              <ResponsivePopoverTitle>
                                Reject Submission
                              </ResponsivePopoverTitle>
                              <ResponsivePopoverDescription>
                                Are you sure you want to reject this submission?
                                This action cannot be undone.
                              </ResponsivePopoverDescription>
                            </ResponsivePopoverHeader>
                            <ResponsivePopoverBody>
                              <div className="flex flex-col gap-4">
                                <Textarea
                                  placeholder="Optional: Add a reason for rejection"
                                  value={(submission.officerNotes ?? "") || ""}
                                  onChange={(e) => {
                                    setSubmissions((subs) =>
                                      subs.map((sub) =>
                                        sub.id == submission.id
                                          ? {
                                              ...sub,
                                              officerNotes: e.target.value,
                                            }
                                          : sub,
                                      ),
                                    );
                                  }}
                                  className="w-full"
                                />
                                <div className="flex justify-end gap-2">
                                  <ResponsivePopoverClose asChild>
                                    <Button
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.preventDefault();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </ResponsivePopoverClose>
                                  <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSubmissions((subs) =>
                                        subs.map((sub) =>
                                          sub.id == submission.id
                                            ? { ...sub, status: "rejected" }
                                            : sub,
                                        ),
                                      );
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </ResponsivePopoverBody>
                          </ResponsivePopoverContent>
                        )}
                      </ResponsivePopover>

                      {/* Approve Button */}
                      <Button
                        size="icon"
                        className={cn(
                          "size-12",
                          defaultStatus == "pending" &&
                            submission.status == "approved"
                            ? "bg-gray-800 hover:bg-gray-900"
                            : "bg-green-800 hover:bg-green-900",
                        )}
                        onClick={
                          submission.status == "approved"
                            ? () => {
                                // Set back to pending/default
                                setSubmissions((subs) =>
                                  subs.map((sub) =>
                                    sub.id == submission.id
                                      ? { ...sub, status: "pending" }
                                      : sub,
                                  ),
                                );
                              }
                            : () => {
                                setSubmissions((subs) =>
                                  subs.map((sub) =>
                                    sub.id == submission.id
                                      ? { ...sub, status: "approved" }
                                      : sub,
                                  ),
                                );
                              }
                        }
                        disabled={
                          self.role != "owner" &&
                          self.role != "staff" &&
                          defaultStatus != "pending"
                        }
                      >
                        {defaultStatus == "pending" &&
                        submission.status == "approved" ? (
                          <Minus />
                        ) : (
                          <Check />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null,
      )}
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
      toast.loading("Saving submissions...", { id: "save-submissions" });
    } else {
      toast.success("Submissions saved!", { id: "save-submissions" });
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
