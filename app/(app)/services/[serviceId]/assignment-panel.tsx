"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { reorderPositions } from "@/lib/assignments/actions";
import type {
  EligibleMember,
  ServicePositionWithAssignment,
  TeamAssignmentGroup,
  TeamForAssignment,
} from "@/lib/assignments/types";
import { AssignmentSlot } from "./assignment-slot";
import { InlinePositionAdder } from "./position-adder";

// ---------------------------------------------------------------------------
// Sortable wrapper for each position slot
// ---------------------------------------------------------------------------

function SortableSlot({
  position,
  eligibleMembers,
  serviceId,
  canManage,
}: {
  position: ServicePositionWithAssignment;
  eligibleMembers: EligibleMember[];
  serviceId: string;
  canManage: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: position.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      {canManage && (
        <button
          type="button"
          className="mt-2.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <AssignmentSlot
          position={position}
          eligibleMembers={eligibleMembers}
          serviceId={serviceId}
          canManage={canManage}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable wrapper for each category group
// ---------------------------------------------------------------------------

function SortableCategory({
  categoryKey,
  positions,
  eligibleMembersMap,
  teamId,
  serviceId,
  canManage,
  onPositionDragEnd,
}: {
  categoryKey: string;
  positions: ServicePositionWithAssignment[];
  eligibleMembersMap: Record<string, EligibleMember[]>;
  teamId: string;
  serviceId: string;
  canManage: boolean;
  onPositionDragEnd: (event: DragEndEvent, categoryPositions: ServicePositionWithAssignment[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `category-${categoryKey}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const positionIds = positions.map((p) => p.id);

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible defaultOpen>
        <div className="flex items-center gap-1">
          {canManage && (
            <button
              type="button"
              className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
          <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground [&[data-state=open]>svg]:rotate-0 [&[data-state=closed]>svg]:-rotate-90">
            <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
            {categoryKey}
            <span className="ml-auto text-xs text-muted-foreground/60">
              {positions.length}
            </span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="flex flex-col gap-1.5 pl-1 pt-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onPositionDragEnd(event, positions)}
          >
            <SortableContext
              items={positionIds}
              strategy={verticalListSortingStrategy}
            >
              {positions.map((position) => {
                const allMembers = eligibleMembersMap[teamId] ?? [];
                const filtered = allMembers.filter((m) =>
                  m.positionIds.includes(position.positionId),
                );
                const members = filtered.length > 0 ? filtered : allMembers;
                return (
                  <SortableSlot
                    key={position.id}
                    position={position}
                    eligibleMembers={members}
                    serviceId={serviceId}
                    canManage={canManage}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssignmentPanelProps {
  teams: TeamAssignmentGroup[];
  serviceId: string;
  serviceDate: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  canManage: boolean;
  allTeams: TeamForAssignment[];
  eligibleMembersMap: Record<string, EligibleMember[]>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignmentPanel({
  teams,
  serviceId,
  canManage,
  allTeams,
  eligibleMembersMap,
}: AssignmentPanelProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center rounded-lg border border-dashed p-8">
          <p className="text-sm text-muted-foreground">
            No positions assigned yet. Use &quot;Add Position&quot; below to
            start scheduling.
          </p>
        </CardContent>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Helpers: build full ordered position IDs from category order
  // -----------------------------------------------------------------------

  function getAllPositionIdsInOrder(
    categoryEntries: [string, ServicePositionWithAssignment[]][],
  ): string[] {
    return categoryEntries.flatMap(([, positions]) =>
      positions.map((p) => p.id),
    );
  }

  // -----------------------------------------------------------------------
  // Category drag end — reorder entire category groups
  // -----------------------------------------------------------------------

  function handleCategoryDragEnd(
    event: DragEndEvent,
    categoryEntries: [string, ServicePositionWithAssignment[]][],
  ) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoryEntries.findIndex(
      ([key]) => `category-${key}` === active.id,
    );
    const newIndex = categoryEntries.findIndex(
      ([key]) => `category-${key}` === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryEntries, oldIndex, newIndex);
    const positionIds = getAllPositionIdsInOrder(reordered);

    startTransition(async () => {
      const result = await reorderPositions({ serviceId, positionIds });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  // -----------------------------------------------------------------------
  // Position drag end — reorder within a category
  // -----------------------------------------------------------------------

  function handlePositionDragEnd(
    event: DragEndEvent,
    categoryPositions: ServicePositionWithAssignment[],
    allCategoryEntries: [string, ServicePositionWithAssignment[]][],
  ) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoryPositions.findIndex((p) => p.id === active.id);
    const newIndex = categoryPositions.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder positions within this category
    const reorderedCategory = arrayMove(categoryPositions, oldIndex, newIndex);

    // Rebuild the full list: replace the moved category's positions
    const categoryKey = allCategoryEntries.find(
      ([, positions]) => positions === categoryPositions,
    )?.[0];

    const updatedEntries = allCategoryEntries.map(([key, positions]) =>
      key === categoryKey
        ? ([key, reorderedCategory] as [string, ServicePositionWithAssignment[]])
        : ([key, positions] as [string, ServicePositionWithAssignment[]]),
    );

    const positionIds = getAllPositionIdsInOrder(updatedEntries);

    startTransition(async () => {
      const result = await reorderPositions({ serviceId, positionIds });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  // -----------------------------------------------------------------------
  // Team cards
  // -----------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {teams.map((team) => {
        const categoryEntries = Object.entries(team.categories);
        const teamData = allTeams.find((t) => t.id === team.teamId);
        const categoryIds = categoryEntries.map(
          ([key]) => `category-${key}`,
        );

        return (
          <Card key={team.teamId}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {team.teamColor && (
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: team.teamColor }}
                  />
                )}
                {team.teamName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <DndContext
                sensors={categorySensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) =>
                  handleCategoryDragEnd(event, categoryEntries)
                }
              >
                <SortableContext
                  items={categoryIds}
                  strategy={verticalListSortingStrategy}
                >
                  {categoryEntries.map(([category, positions]) => (
                    <SortableCategory
                      key={category}
                      categoryKey={category}
                      positions={positions}
                      eligibleMembersMap={eligibleMembersMap}
                      teamId={team.teamId}
                      serviceId={serviceId}
                      canManage={canManage}
                      onPositionDragEnd={(event, catPositions) =>
                        handlePositionDragEnd(
                          event,
                          catPositions,
                          categoryEntries,
                        )
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {canManage && teamData && (
                <InlinePositionAdder serviceId={serviceId} team={teamData} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
