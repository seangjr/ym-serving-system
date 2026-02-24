"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useState,
  useTransition,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSong, updateSong } from "@/lib/songs/actions";
import { type CreateSongInput, createSongSchema } from "@/lib/songs/schemas";
import type { SongSummary } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSong?: SongSummary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SongFormDialog({
  open,
  onOpenChange,
  editSong,
}: SongFormDialogProps) {
  const isEdit = !!editSong;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Tag input state
  const [tags, setTags] = useState<string[]>(editSong?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<CreateSongInput>({
    resolver: zodResolver(createSongSchema),
    defaultValues: editSong
      ? {
          title: editSong.title,
          artist: editSong.artist ?? "",
          defaultKey: editSong.default_key ?? "",
          defaultTempo: editSong.default_tempo ?? undefined,
          tags: editSong.tags,
          durationSeconds: editSong.duration_seconds ?? undefined,
          links: editSong.links.length > 0 ? editSong.links : [],
          notes: editSong.notes ?? "",
        }
      : {
          title: "",
          artist: "",
          defaultKey: "",
          tags: [],
          links: [],
          notes: "",
        },
  });

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({
    control: form.control,
    name: "links",
  });

  // ----- Tag management -----

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().toLowerCase();
      if (!tag || tags.includes(tag)) return;
      const next = [...tags, tag];
      setTags(next);
      form.setValue("tags", next);
      setTagInput("");
    },
    [tags, form],
  );

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      const next = tags.slice(0, -1);
      setTags(next);
      form.setValue("tags", next);
    }
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    form.setValue("tags", next);
  }

  // ----- Dialog open/close -----

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setServerError(null);
      setTagInput("");
      setTags(editSong?.tags ?? []);
      form.reset(
        editSong
          ? {
              title: editSong.title,
              artist: editSong.artist ?? "",
              defaultKey: editSong.default_key ?? "",
              defaultTempo: editSong.default_tempo ?? undefined,
              tags: editSong.tags,
              durationSeconds: editSong.duration_seconds ?? undefined,
              links: editSong.links.length > 0 ? editSong.links : [],
              notes: editSong.notes ?? "",
            }
          : {
              title: "",
              artist: "",
              defaultKey: "",
              tags: [],
              links: [],
              notes: "",
            },
      );
    }
  }

  // ----- Submit -----

  function handleSubmit(values: CreateSongInput) {
    setServerError(null);

    // Ensure tags are synced
    values.tags = tags;

    startTransition(async () => {
      const result = isEdit
        ? await updateSong({ ...values, id: editSong.id })
        : await createSong(values);

      if ("error" in result) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Song updated" : "Song added");
      onOpenChange(false);
      form.reset();
      setTags([]);
      setTagInput("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Song" : "Add Song"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the song's details."
              : "Add a new song to the library."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="song-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="song-title"
              placeholder="e.g. Amazing Grace"
              {...form.register("title")}
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Artist */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-artist">Artist</Label>
              <Input
                id="song-artist"
                placeholder="e.g. Hillsong Worship"
                {...form.register("artist")}
              />
            </div>

            {/* Default Key */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-key">Default Key</Label>
              <Input
                id="song-key"
                placeholder="e.g., C, Bb, F#m"
                {...form.register("defaultKey")}
              />
            </div>

            {/* Default Tempo */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-tempo">Default Tempo (BPM)</Label>
              <Input
                id="song-tempo"
                type="number"
                placeholder="BPM"
                {...form.register("defaultTempo", {
                  setValueAs: (v: string) => {
                    if (v === "" || v === undefined || v === null) {
                      return undefined;
                    }
                    const n = Number(v);
                    return Number.isNaN(n) ? undefined : n;
                  },
                })}
                aria-invalid={!!form.formState.errors.defaultTempo}
              />
              {form.formState.errors.defaultTempo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.defaultTempo.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-duration">Duration (seconds)</Label>
              <Input
                id="song-duration"
                type="number"
                placeholder="Duration in seconds"
                {...form.register("durationSeconds", {
                  setValueAs: (v: string) => {
                    if (v === "" || v === undefined || v === null) {
                      return undefined;
                    }
                    const n = Number(v);
                    return Number.isNaN(n) ? undefined : n;
                  },
                })}
                aria-invalid={!!form.formState.errors.durationSeconds}
              />
              {form.formState.errors.durationSeconds && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.durationSeconds.message}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="song-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border p-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <input
                id="song-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput);
                }}
                placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                className="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add a tag
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Links</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendLink({ label: "", url: "" })}
              >
                <Plus className="size-4" />
                Add Link
              </Button>
            </div>

            {linkFields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No links added. Click &quot;Add Link&quot; to add YouTube, chord
                chart, or other resources.
              </p>
            )}

            {linkFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="e.g., YouTube, Chord Chart"
                    {...form.register(`links.${index}.label`)}
                    aria-invalid={!!form.formState.errors.links?.[index]?.label}
                  />
                  <Input
                    placeholder="https://..."
                    {...form.register(`links.${index}.url`)}
                    aria-invalid={!!form.formState.errors.links?.[index]?.url}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeLink(index)}
                  aria-label="Remove link"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            {/* Link validation errors */}
            {form.formState.errors.links &&
              Array.isArray(form.formState.errors.links) &&
              form.formState.errors.links.map(
                (err, i) =>
                  err && (
                    <p
                      key={`link-err-${linkFields[i]?.id ?? i}`}
                      className="text-sm text-destructive"
                    >
                      Link {i + 1}:{" "}
                      {err.label?.message || err.url?.message || "Invalid"}
                    </p>
                  ),
              )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="song-notes">Notes</Label>
            <Textarea
              id="song-notes"
              placeholder="General notes about the song..."
              {...form.register("notes")}
            />
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Add Song"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
