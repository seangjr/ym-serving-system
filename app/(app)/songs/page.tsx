import { Music } from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { getDistinctKeys, getPopularTags, getSongs } from "@/lib/songs/queries";
import { createClient } from "@/lib/supabase/server";
import { AddSongButton } from "./add-song-button";
import { SongFilters } from "./song-filters";
import { SongTable } from "./song-table";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Song Library",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SongLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const keyFilter = params.key ?? "";
  const tagFilter = params.tag ?? "";

  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  const canManage = isAdminOrCommittee(role);

  // Search is handled client-side for instant filtering; server filters key/tag only
  const [songs, popularTags, distinctKeys] = await Promise.all([
    getSongs({
      key: keyFilter || undefined,
      tag: tagFilter || undefined,
    }),
    getPopularTags(10),
    getDistinctKeys(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Music className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Song Library</h1>
          <Badge variant="secondary" className="ml-1">
            {songs.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse and manage the song catalog
        </p>
      </div>

      {/* Filters + Add Song (same row) */}
      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={null}>
          <SongFilters
            distinctKeys={distinctKeys}
            popularTags={popularTags}
            activeKey={keyFilter || undefined}
            activeTag={tagFilter || undefined}
          />
        </Suspense>

        {canManage && (
          <div className="ml-auto">
            <AddSongButton />
          </div>
        )}
      </div>

      {/* Song table with integrated instant search */}
      <SongTable songs={songs} canManage={canManage} />
    </div>
  );
}
