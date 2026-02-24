"use client";

import { ListMusic, Settings, Users } from "lucide-react";
import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ServiceTabsProps {
  assignmentsContent: React.ReactNode;
  setlistContent: React.ReactNode;
  detailsContent: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceTabs({
  assignmentsContent,
  setlistContent,
  detailsContent,
}: ServiceTabsProps) {
  return (
    <Tabs defaultValue="assignments">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="assignments">
          <Users className="size-4" />
          Assignments
        </TabsTrigger>
        <TabsTrigger value="setlist">
          <ListMusic className="size-4" />
          Setlist
        </TabsTrigger>
        <TabsTrigger value="details">
          <Settings className="size-4" />
          Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assignments">{assignmentsContent}</TabsContent>

      <TabsContent value="setlist">{setlistContent}</TabsContent>

      <TabsContent value="details">{detailsContent}</TabsContent>
    </Tabs>
  );
}
