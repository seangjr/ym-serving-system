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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Upcoming Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Services
          </CardTitle>
          <CalendarCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingCount}</div>
        </CardContent>
      </Card>

      {/* Unassigned Positions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Unassigned Positions
          </CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unassignedPositions}</div>
          {stats.unassignedPositions === 0 && (
            <p className="text-xs text-muted-foreground">
              Available after scheduling
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Confirmations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Confirmations
          </CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingConfirmations}</div>
          {stats.pendingConfirmations === 0 && (
            <p className="text-xs text-muted-foreground">
              Available after scheduling
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
