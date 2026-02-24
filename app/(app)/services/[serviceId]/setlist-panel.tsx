"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Library, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { reorderSetlist } from "@/lib/songs/actions";
import type { SetlistItemWithSong, SongSummary } from "@/lib/songs/types";
import { SetlistItemRow } from "./setlist-item-row";
import { SongBrowseDialog } from "./song-browse-dialog";
import { SongPicker } from "./song-picker";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SetlistPanelProps {
  items: SetlistItemWithSong[];
  allSongs: SongSummary[];
  serviceId: string;
  canManage: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SetlistPanel({
  items,
  allSongs,
  serviceId,
  canManage,
}: SetlistPanelProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [browseOpen, setBrowseOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = items.map((i) => i.id);
  const existingItemSongIds = items.map((i) => i.song_id);

  // -------------------------------------------------------------------------
  // Drag handler
  // -------------------------------------------------------------------------

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const newItemIds = reordered.map((i) => i.id);

    startTransition(async () => {
      const result = await reorderSetlist({
        serviceId,
        itemIds: newItemIds,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (items.length === 0 && !canManage) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
        <Music className="mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No songs in setlist
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Add songs from the library to build your setlist
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3">
      {/* Add songs controls */}
      {canManage && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SongPicker
            allSongs={allSongs}
            serviceId={serviceId}
            existingItemSongIds={existingItemSongIds}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBrowseOpen(true)}
          >
            <Library className="size-4" />
            Browse Library
          </Button>
        </div>
      )}

      {/* Setlist items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <Music className="mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No songs in setlist
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Add songs from the library to build your setlist
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5">
              {items.map((item, idx) => (
                <SetlistItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  canManage={canManage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Browse dialog */}
      {canManage && (
        <SongBrowseDialog
          open={browseOpen}
          onOpenChange={setBrowseOpen}
          allSongs={allSongs}
          serviceId={serviceId}
          existingItemSongIds={existingItemSongIds}
        />
      )}
    </div>
  );
}
