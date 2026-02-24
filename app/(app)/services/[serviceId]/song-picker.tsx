"use client";

import { Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { addToSetlist } from "@/lib/songs/actions";
import type { SongSummary } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongPickerProps {
  allSongs: SongSummary[];
  serviceId: string;
  existingItemSongIds: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SongPicker({
  allSongs,
  serviceId,
  existingItemSongIds,
}: SongPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSelect(songId: string) {
    startTransition(async () => {
      const result = await addToSetlist({ serviceId, songId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Song added to setlist");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Combobox<string>
      open={open}
      onOpenChange={setOpen}
      value={null}
      onValueChange={(val) => {
        if (val) handleSelect(val);
      }}
      itemToStringLabel={(songId) => {
        const song = allSongs.find((s) => s.id === songId);
        return song
          ? `${song.title}${song.artist ? ` - ${song.artist}` : ""}`
          : "";
      }}
    >
      <ComboboxInput
        placeholder="Search songs..."
        className="h-8 w-56 text-xs"
        showClear={false}
        disabled={isPending}
      />
      <ComboboxContent>
        <ComboboxList>
          {allSongs.map((song) => {
            const inSetlist = existingItemSongIds.includes(song.id);
            return (
              <ComboboxItem key={song.id} value={song.id}>
                <span className="flex items-center gap-1.5">
                  <Music className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{song.title}</span>
                  {song.artist && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      - {song.artist}
                    </span>
                  )}
                  {inSetlist && (
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      in setlist
                    </span>
                  )}
                </span>
              </ComboboxItem>
            );
          })}
          <ComboboxEmpty>No songs found</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
