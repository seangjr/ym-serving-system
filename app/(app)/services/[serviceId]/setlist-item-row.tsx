"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  removeFromSetlist,
  updateSetlistItemOverrides,
} from "@/lib/songs/actions";
import type { SetlistItemWithSong } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SetlistItemRowProps {
  item: SetlistItemWithSong;
  index: number;
  canManage: boolean;
  onOptimisticUpdate: (
    itemId: string,
    updates: { key_override?: string | null; tempo_override?: number | null },
  ) => void;
}

// ---------------------------------------------------------------------------
// Inline editable field
// ---------------------------------------------------------------------------

function InlineEdit({
  value,
  defaultValue,
  isOverridden,
  onSave,
  onReset,
  placeholder,
  canManage,
  type,
  inputClassName,
}: {
  value: string;
  defaultValue: string;
  isOverridden: boolean;
  onSave: (val: string) => void;
  onReset: () => void;
  placeholder: string;
  canManage: boolean;
  type: "text" | "number";
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  if (editing && canManage) {
    return (
      <input
        ref={inputRef}
        type={type}
        className={`h-7 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${inputClassName ?? "w-16"}`}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (editValue !== value) {
            onSave(editValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (editValue !== value) {
              onSave(editValue);
            }
          }
          if (e.key === "Escape") {
            setEditing(false);
            setEditValue(value);
          }
        }}
        // biome-ignore lint/a11y/noAutofocus: intentional for inline click-to-edit UX
        autoFocus
      />
    );
  }

  const displayValue = value || defaultValue;
  const hasValue = displayValue !== "";

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => {
          if (!canManage) return;
          setEditValue(value);
          setEditing(true);
        }}
        className={`text-xs ${canManage ? "cursor-pointer hover:underline" : ""} ${
          isOverridden
            ? "font-bold text-blue-600 dark:text-blue-400"
            : "text-muted-foreground"
        }`}
        title={
          canManage ? `Click to edit ${placeholder.toLowerCase()}` : undefined
        }
        disabled={!canManage}
      >
        {hasValue ? (
          displayValue
        ) : (
          <span className="italic opacity-50">{placeholder}</span>
        )}
      </button>
      {isOverridden && canManage && (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Reset to library default"
        >
          <RotateCcw className="size-3" />
        </button>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SetlistItemRow({
  item,
  index,
  canManage,
  onOptimisticUpdate,
}: SetlistItemRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const keyIsOverridden = item.key_override !== null;
  const tempoIsOverridden = item.tempo_override !== null;

  // -------------------------------------------------------------------------
  // Handlers (with optimistic updates)
  // -------------------------------------------------------------------------

  function handleKeySave(val: string) {
    // Optimistic: update parent state immediately
    onOptimisticUpdate(item.id, { key_override: val });

    startTransition(async () => {
      const result = await updateSetlistItemOverrides({
        itemId: item.id,
        keyOverride: val,
      });
      if ("error" in result) {
        // Revert on error
        onOptimisticUpdate(item.id, { key_override: item.key_override });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleTempoSave(val: string) {
    const num = Number.parseInt(val, 10);
    if (val === "" || Number.isNaN(num)) return;

    // Optimistic: update parent state immediately
    onOptimisticUpdate(item.id, { tempo_override: num });

    startTransition(async () => {
      const result = await updateSetlistItemOverrides({
        itemId: item.id,
        tempoOverride: num,
      });
      if ("error" in result) {
        // Revert on error
        onOptimisticUpdate(item.id, { tempo_override: item.tempo_override });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleNotesSave(val: string) {
    startTransition(async () => {
      const result = await updateSetlistItemOverrides({
        itemId: item.id,
        notes: val,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleResetKey() {
    // Optimistic: clear key override immediately
    onOptimisticUpdate(item.id, { key_override: null });

    startTransition(async () => {
      const result = await updateSetlistItemOverrides({
        itemId: item.id,
        keyOverride: "",
      });
      if ("error" in result) {
        // Revert on error
        onOptimisticUpdate(item.id, { key_override: item.key_override });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleResetTempo() {
    // Optimistic: clear tempo override immediately
    onOptimisticUpdate(item.id, { tempo_override: null });

    startTransition(async () => {
      const result = await updateSetlistItemOverrides({
        itemId: item.id,
        tempoOverride: null,
      });
      if ("error" in result) {
        // Revert on error
        onOptimisticUpdate(item.id, { tempo_override: item.tempo_override });
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove() {
    if (!window.confirm("Remove this song from the setlist?")) return;

    startTransition(async () => {
      const result = await removeFromSetlist({ itemId: item.id });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Song removed from setlist");
      router.refresh();
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${isPending ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      {canManage && (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}

      {/* Row number */}
      <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">
            {item.songs.title}
          </span>
          {item.songs.artist && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.songs.artist}
            </span>
          )}
        </div>

        {/* Key, tempo, notes row */}
        <div className="mt-0.5 flex flex-wrap items-center gap-3">
          <InlineEdit
            value={item.key_override ?? ""}
            defaultValue={item.songs.default_key ?? ""}
            isOverridden={keyIsOverridden}
            onSave={handleKeySave}
            onReset={handleResetKey}
            placeholder="Key"
            canManage={canManage}
            type="text"
            inputClassName="w-14"
          />

          <InlineEdit
            value={
              item.tempo_override !== null ? String(item.tempo_override) : ""
            }
            defaultValue={
              item.songs.default_tempo !== null
                ? String(item.songs.default_tempo)
                : ""
            }
            isOverridden={tempoIsOverridden}
            onSave={handleTempoSave}
            onReset={handleResetTempo}
            placeholder="BPM"
            canManage={canManage}
            type="number"
            inputClassName="w-14"
          />

          {/* Notes inline edit */}
          {notesEditing && canManage ? (
            <input
              type="text"
              className="h-7 flex-1 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={notesValue}
              placeholder="Add note..."
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={() => {
                setNotesEditing(false);
                if (notesValue !== (item.notes ?? "")) {
                  handleNotesSave(notesValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setNotesEditing(false);
                  if (notesValue !== (item.notes ?? "")) {
                    handleNotesSave(notesValue);
                  }
                }
                if (e.key === "Escape") {
                  setNotesEditing(false);
                  setNotesValue(item.notes ?? "");
                }
              }}
              // biome-ignore lint/a11y/noAutofocus: intentional for inline click-to-edit UX
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!canManage) return;
                setNotesValue(item.notes ?? "");
                setNotesEditing(true);
              }}
              className={`text-xs ${canManage ? "cursor-pointer hover:underline" : ""} ${
                item.notes
                  ? "text-foreground"
                  : "italic text-muted-foreground opacity-50"
              }`}
              disabled={!canManage}
            >
              {item.notes || "Notes"}
            </button>
          )}
        </div>
      </div>

      {/* Remove button */}
      {canManage && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRemove}
          disabled={isPending}
          title="Remove from setlist"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}
