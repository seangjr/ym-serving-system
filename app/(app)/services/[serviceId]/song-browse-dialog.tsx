"use client";

import { Check, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { addToSetlist } from "@/lib/songs/actions";
import type { SongSummary } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongBrowseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSongs: SongSummary[];
  serviceId: string;
  existingItemSongIds: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SongBrowseDialog({
  open,
  onOpenChange,
  allSongs,
  serviceId,
  existingItemSongIds,
}: SongBrowseDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(songId: string) {
    startTransition(async () => {
      const result = await addToSetlist({ serviceId, songId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Song added to setlist");
      router.refresh();
      // Keep dialog open for adding multiple songs
    });
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Browse Song Library"
      description="Search and add songs to the setlist"
    >
      <CommandInput placeholder="Search songs by title or artist..." />
      <CommandList>
        <CommandEmpty>
          No songs found. Add songs to the library first.
        </CommandEmpty>
        <CommandGroup heading="Songs">
          {allSongs.map((song) => {
            const inSetlist = existingItemSongIds.includes(song.id);
            return (
              <CommandItem
                key={song.id}
                value={`${song.title} ${song.artist ?? ""}`}
                onSelect={() => handleSelect(song.id)}
                disabled={isPending}
              >
                <Music className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{song.title}</span>
                  {song.artist && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {song.artist}
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  {song.default_key && <span>{song.default_key}</span>}
                  {song.default_tempo && <span>{song.default_tempo} BPM</span>}
                  {inSetlist && <Check className="size-3.5 text-green-500" />}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
