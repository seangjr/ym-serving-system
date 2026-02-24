import { Music } from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { getDistinctKeys, getPopularTags, getSongs } from "@/lib/songs/queries";
import { createClient } from "@/lib/supabase/server";
import { FilterChips } from "./filter-chips";
import { SongSearch } from "./song-search";
import { SongTableWrapper } from "./song-table-wrapper";

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
  searchParams: Promise<{ q?: string; key?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const keyFilter = params.key ?? "";
  const tagFilter = params.tag ?? "";

  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  const canManage = isAdminOrCommittee(role);

  const [songs, popularTags, distinctKeys] = await Promise.all([
    getSongs({
      search: searchQuery || undefined,
      key: keyFilter || undefined,
      tag: tagFilter || undefined,
    }),
    getPopularTags(10),
    getDistinctKeys(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Add Song button (managed by SongTableWrapper for dialog state) */}
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

      {/* Search + Filter chips */}
      <div className="flex flex-col gap-3">
        <Suspense fallback={null}>
          <SongSearch defaultValue={searchQuery} />
        </Suspense>

        <FilterChips
          distinctKeys={distinctKeys}
          popularTags={popularTags}
          activeKey={keyFilter || undefined}
          activeTag={tagFilter || undefined}
          searchQuery={searchQuery || undefined}
        />
      </div>

      {/* Song table with Add Song button + dialog (client component) */}
      <SongTableWrapper songs={songs} canManage={canManage} />
    </div>
  );
}
