import type { PopularTag } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FilterChipsProps {
  distinctKeys: string[];
  popularTags: PopularTag[];
  activeKey?: string;
  activeTag?: string;
  searchQuery?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterChips({
  distinctKeys,
  popularTags,
  activeKey,
  activeTag,
  searchQuery,
}: FilterChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Key chips */}
      {distinctKeys.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="All Keys"
            href={buildHref({ q: searchQuery, tag: activeTag })}
            active={!activeKey}
          />
          {distinctKeys.map((key) => (
            <FilterChip
              key={key}
              label={key}
              href={buildHref({
                q: searchQuery,
                key: activeKey === key ? undefined : key,
                tag: activeTag,
              })}
              active={activeKey === key}
            />
          ))}
        </div>
      )}

      {/* Tag chips */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="All Tags"
            href={buildHref({ q: searchQuery, key: activeKey })}
            active={!activeTag}
          />
          {popularTags.map((t) => (
            <FilterChip
              key={t.tag}
              label={t.tag}
              href={buildHref({
                q: searchQuery,
                key: activeKey,
                tag: activeTag === t.tag ? undefined : t.tag,
              })}
              active={activeTag === t.tag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHref(params: { q?: string; key?: string; tag?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.key) sp.set("key", params.key);
  if (params.tag) sp.set("tag", params.tag);
  const qs = sp.toString();
  return qs ? `/songs?${qs}` : "/songs";
}

// ---------------------------------------------------------------------------
// Filter chip (server component - anchor tag for URL-based filtering)
// ---------------------------------------------------------------------------

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {label}
    </a>
  );
}
