"use client";

import type { SongSummary } from "@/lib/songs/types";

// Placeholder - will be fully implemented in Task 2
interface SongFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSong?: SongSummary;
}

export function SongFormDialog({ open, onOpenChange }: SongFormDialogProps) {
  if (!open) return null;
  return (
    <div>
      <button type="button" onClick={() => onOpenChange(false)}>
        Close
      </button>
    </div>
  );
}
