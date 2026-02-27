"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SongFormDialog } from "./song-form-dialog";

export function AddSongButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Song
      </Button>
      <SongFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
