"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Music,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { deleteSong } from "@/lib/songs/actions";
import type { SongSummary } from "@/lib/songs/types";
import { SongFormDialog } from "./song-form-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = "title" | "artist" | "key" | "tempo";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongTableProps {
  songs: SongSummary[];
  canManage: boolean;
}

// ---------------------------------------------------------------------------
// Sortable header sub-component
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {!isActive && <ArrowUpDown className="size-3 opacity-40" />}
        {isActive && sortDir === "asc" && <ArrowUp className="size-3" />}
        {isActive && sortDir === "desc" && <ArrowDown className="size-3" />}
      </button>
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SongTable({ songs, canManage }: SongTableProps) {
  const [editingSong, setEditingSong] = useState<SongSummary | null>(null);
  const [deletingSong, setDeletingSong] = useState<SongSummary | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir("asc");
    }
  }

  // Client-side search filter (instant)
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q)),
    );
  }, [songs, searchQuery]);

  const sortedSongs = useMemo(() => {
    if (!sortField) return filteredSongs;

    return [...filteredSongs].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      switch (sortField) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "artist": {
          if (!a.artist && !b.artist) return 0;
          if (!a.artist) return 1;
          if (!b.artist) return -1;
          return dir * a.artist.localeCompare(b.artist);
        }
        case "key": {
          if (!a.default_key && !b.default_key) return 0;
          if (!a.default_key) return 1;
          if (!b.default_key) return -1;
          return dir * a.default_key.localeCompare(b.default_key);
        }
        case "tempo": {
          if (a.default_tempo === null && b.default_tempo === null) return 0;
          if (a.default_tempo === null) return 1;
          if (b.default_tempo === null) return -1;
          return dir * (a.default_tempo - b.default_tempo);
        }
        default:
          return 0;
      }
    });
  }, [filteredSongs, sortField, sortDir]);

  function handleDelete() {
    if (!deletingSong) return;
    startDeleteTransition(async () => {
      const result = await deleteSong(deletingSong.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`"${deletingSong.title}" deleted`);
      }
      setDeletingSong(null);
    });
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Music className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-lg font-medium">No songs found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first song to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Instant search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by title or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    label="Title"
                    field="title"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="w-[280px] max-w-[280px]"
                  />
                  <SortableHeader
                    label="Artist"
                    field="artist"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="w-[180px] max-w-[180px]"
                  />
                  <SortableHeader
                    label="Key"
                    field="key"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="w-[80px]"
                  />
                  <SortableHeader
                    label="Tempo"
                    field="tempo"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="w-[90px]"
                  />
                  <TableHead className="w-[200px] max-w-[200px]">
                    Tags
                  </TableHead>
                  {canManage && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium truncate max-w-[280px]">
                      {song.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[180px]">
                      {song.artist || "--"}
                    </TableCell>
                    <TableCell>{song.default_key || "--"}</TableCell>
                    <TableCell>
                      {song.default_tempo ? `${song.default_tempo} BPM` : "--"}
                    </TableCell>
                    <TableCell className="overflow-hidden max-w-[200px]">
                      <TagBadges tags={song.tags} />
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <SongActions
                          song={song}
                          onEdit={() => setEditingSong(song)}
                          onDelete={() => setDeletingSong(song)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: card grid */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {sortedSongs.map((song) => (
          <Card key={song.id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{song.title}</p>
                  {song.artist && (
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {song.default_key && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {song.default_key}
                      </span>
                    )}
                    {song.default_tempo && (
                      <span>{song.default_tempo} BPM</span>
                    )}
                  </div>
                  {song.tags.length > 0 && (
                    <div className="mt-2">
                      <TagBadges tags={song.tags} />
                    </div>
                  )}
                </div>
                {canManage && (
                  <SongActions
                    song={song}
                    onEdit={() => setEditingSong(song)}
                    onDelete={() => setDeletingSong(song)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      {editingSong && (
        <SongFormDialog
          open={!!editingSong}
          onOpenChange={(open) => {
            if (!open) setEditingSong(null);
          }}
          editSong={editingSong}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingSong}
        onOpenChange={(open) => {
          if (!open) setDeletingSong(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSong?.title}&quot;?
              This will also remove it from all setlists. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tag badges (truncate to first 3 + "+N more")
// ---------------------------------------------------------------------------

function TagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  const visible = tags.slice(0, 3);
  const remaining = tags.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action dropdown
// ---------------------------------------------------------------------------

function SongActions({
  song,
  onEdit,
  onDelete,
}: {
  song: SongSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${song.title}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
