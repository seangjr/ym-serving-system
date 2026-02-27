"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PopularTag } from "@/lib/songs/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SongFiltersProps {
  distinctKeys: string[];
  popularTags: PopularTag[];
  activeKey?: string;
  activeTag?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SongFilters({
  distinctKeys,
  popularTags,
  activeKey,
  activeTag,
}: SongFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCount =
    (activeKey ? 1 : 0) + (activeTag ? 1 : 0);

  // -------------------------------------------------------------------------
  // URL update helper (preserves existing params)
  // -------------------------------------------------------------------------

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("key");
    params.delete("tag");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filters button with popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="size-4" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3">
          {/* Key filter */}
          {distinctKeys.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Key
              </label>
              <Select
                value={activeKey ?? ""}
                onValueChange={(val) =>
                  updateParam("key", val === "__all__" ? undefined : val)
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="All Keys" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  <SelectItem value="__all__">All Keys</SelectItem>
                  {distinctKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tag filter */}
          {popularTags.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tag
              </label>
              <Select
                value={activeTag ?? ""}
                onValueChange={(val) =>
                  updateParam("tag", val === "__all__" ? undefined : val)
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  <SelectItem value="__all__">All Tags</SelectItem>
                  {popularTags.map((t) => (
                    <SelectItem key={t.tag} value={t.tag}>
                      {t.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear all */}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full text-muted-foreground"
            >
              Clear all filters
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {activeKey && (
        <Badge
          variant="secondary"
          className="gap-1 cursor-pointer"
          onClick={() => updateParam("key", undefined)}
        >
          Key: {activeKey}
          <X className="size-3" />
        </Badge>
      )}

      {activeTag && (
        <Badge
          variant="secondary"
          className="gap-1 cursor-pointer"
          onClick={() => updateParam("tag", undefined)}
        >
          Tag: {activeTag}
          <X className="size-3" />
        </Badge>
      )}
    </div>
  );
}
