"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SongSummary } from "@/lib/songs/types";
import { SongFormDialog } from "./song-form-dialog";
import { SongTable } from "./song-table";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongTableWrapperProps {
  songs: SongSummary[];
  canManage: boolean;
}

// ---------------------------------------------------------------------------
// Wrapper with Add Song dialog state
// ---------------------------------------------------------------------------

export function SongTableWrapper({ songs, canManage }: SongTableWrapperProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <>
      {/* Add Song button */}
      {canManage && (
        <div className="-mt-3 flex justify-end">
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4" />
            Add Song
          </Button>
        </div>
      )}

      {/* Song table */}
      <SongTable songs={songs} canManage={canManage} />

      {/* Add song dialog */}
      {canManage && (
        <SongFormDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      )}
    </>
  );
}
