"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Client wrapper for Create Service button + dialog
// ---------------------------------------------------------------------------

interface DashboardActionsProps {
  serviceTypes: { id: string; name: string; label: string; color: string }[];
}

export function DashboardActions({ serviceTypes }: DashboardActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" />
        Create Service
      </Button>
      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceTypes={serviceTypes}
      />
    </>
  );
}
