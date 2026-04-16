"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

const MSG = {
  saveFail: "\uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc5b4\uc694.",
  deleteConfirm:
    "\uc774 \ucf54\uc2a4\ub97c \uc0ad\uc81c\ud560\uae4c\uc694? \uc800\uc7a5\ud55c \ubaa9\ub85d\uc5d0\uc11c \uc0ac\ub77c\uc9c0\uba70 \ub418\ub3cc\ub9b4 \uc218 \uc5c6\uc5b4\uc694.",
  deleteFail: "\uc0ad\uc81c\ud558\uc9c0 \ubabb\ud588\uc5b4\uc694.",
  errGeneric: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
  needTitle: "\uc81c\ubaa9\uc744 \uc785\ub825\ud574 \uc8fc\uc138\uc694.",
  editTitle: "\uc81c\ubaa9 \uc218\uc815",
  deleteCourse: "\ucf54\uc2a4 \uc0ad\uc81c",
  courseTitleLabel: "\ucf54\uc2a4 \uc81c\ubaa9",
  save: "\uc800\uc7a5",
  cancel: "\ucde8\uc18c",
} as const;

export function SavedCourseManage({
  savedId,
  course,
  onCourseUpdated,
}: {
  savedId: string;
  course: DateCourse;
  onCourseUpdated: (next: DateCourse) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(course.course_title);
  const [busy, setBusy] = useState<"patch" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(course.course_title);
    }
  }, [course.course_title, editing]);

  async function saveTitle() {
    const title = draft.trim();
    if (!title) {
      setError(MSG.needTitle);
      return;
    }
    setBusy("patch");
    setError(null);
    try {
      const res = await fetch(`/api/saved-courses/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { course?: DateCourse; error?: string };
      if (!res.ok) {
        throw new Error(data.error || MSG.saveFail);
      }
      if (data.course) {
        onCourseUpdated(data.course);
      }
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : MSG.saveFail);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!globalThis.confirm(MSG.deleteConfirm)) {
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/saved-courses/${savedId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || MSG.deleteFail);
      }
      router.push("/my-courses");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : MSG.errGeneric);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!editing ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 gap-2 touch-manipulation rounded-xl border-[#FF6B6B]/35"
              disabled={busy !== null}
              onClick={() => {
                setDraft(course.course_title);
                setEditing(true);
                setError(null);
              }}
            >
              <Pencil className="size-4" />
              {MSG.editTitle}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="h-11 gap-2 touch-manipulation rounded-xl"
              disabled={busy !== null}
              onClick={() => void remove()}
            >
              {busy === "delete" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {MSG.deleteCourse}
            </Button>
          </>
        ) : (
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1">
            <label className="text-xs font-medium text-muted-foreground">
              {MSG.courseTitleLabel}
            </label>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              className={cn(
                "h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none",
                "ring-offset-background focus-visible:ring-2 focus-visible:ring-[#FF6B6B]/40"
              )}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="lg"
                className="h-11 flex-1 gap-2 touch-manipulation rounded-xl sm:flex-none"
                disabled={busy !== null}
                onClick={() => void saveTitle()}
              >
                {busy === "patch" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {MSG.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 flex-1 touch-manipulation rounded-xl sm:flex-none"
                disabled={busy !== null}
                onClick={() => {
                  setEditing(false);
                  setDraft(course.course_title);
                  setError(null);
                }}
              >
                {MSG.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
