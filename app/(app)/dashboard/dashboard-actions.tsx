"use client";

import { ChevronDown, Plus, Repeat, Settings } from "lucide-react";
import { useState } from "react";
import { RecurringServiceDialog } from "@/components/services/recurring-service-dialog";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";
import { ServiceTypeManager } from "@/components/services/service-type-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Client wrapper for Create Service button + advanced actions dropdown
// ---------------------------------------------------------------------------

interface DashboardActionsProps {
  serviceTypes: { id: string; name: string; label: string; color: string }[];
  allServiceTypes: {
    id: string;
    name: string;
    label: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
  }[];
  isAdmin: boolean;
}

export function DashboardActions({
  serviceTypes,
  allServiceTypes,
  isAdmin,
}: DashboardActionsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Primary: Create Service */}
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Service
        </Button>

        {/* Secondary dropdown for advanced actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ChevronDown className="size-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRecurringOpen(true)}>
              <Repeat className="size-4" />
              Create Recurring Series
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onSelect={() => setTypesOpen(true)}>
                <Settings className="size-4" />
                Manage Service Types
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create single service dialog */}
      <ServiceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        serviceTypes={serviceTypes}
      />

      {/* Create recurring series dialog */}
      <RecurringServiceDialog
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        serviceTypes={serviceTypes}
      />

      {/* Manage service types dialog (admin only) */}
      {isAdmin && (
        <Dialog open={typesOpen} onOpenChange={setTypesOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Service Types</DialogTitle>
              <DialogDescription>
                Add, edit, or remove service type categories.
              </DialogDescription>
            </DialogHeader>
            <ServiceTypeManager serviceTypes={allServiceTypes} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
