import { CalendarCheck, Clock, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceStatsProps {
  stats: {
    upcomingCount: number;
    unassignedPositions: number;
    pendingConfirmations: number;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceStats({ stats }: ServiceStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Upcoming Services */}
      <Card className="gap-1 py-3">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Upcoming
          </CardTitle>
          <CalendarCheck className="size-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="text-xl font-bold">{stats.upcomingCount}</div>
        </CardContent>
      </Card>

      {/* Unassigned Positions */}
      <Card className="gap-1 py-3">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Unassigned
          </CardTitle>
          <Users className="size-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="text-xl font-bold">{stats.unassignedPositions}</div>
        </CardContent>
      </Card>

      {/* Pending Confirmations */}
      <Card className="gap-1 py-3">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Pending
          </CardTitle>
          <Clock className="size-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="text-xl font-bold">{stats.pendingConfirmations}</div>
        </CardContent>
      </Card>
    </div>
  );
}
