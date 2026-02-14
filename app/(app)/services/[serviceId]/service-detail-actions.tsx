"use client";

import { Copy, Pencil, Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DuplicateServiceDialog } from "@/components/services/duplicate-service-dialog";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";
import { LoadTemplateDialog, SaveTemplateDialog } from "./template-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteService } from "@/lib/services/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceForActions {
  id: string;
  title: string;
  serviceDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  serviceTypeId?: string;
  rehearsalDate?: string;
  rehearsalTime?: string;
  rehearsalNotes?: string;
  notes?: string;
  isCancelled: boolean;
}

interface TeamOption {
  id: string;
  name: string;
}

interface ServiceDetailActionsProps {
  service: ServiceForActions;
  serviceTypes: { id: string; name: string; label: string; color: string }[];
  teams: TeamOption[];
  teamsWithPositions: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceDetailActions({
  service,
  serviceTypes,
  teams,
  teamsWithPositions,
}: ServiceDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteService(service.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Service deleted");
      router.push("/dashboard");
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          disabled={isPending}
        >
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDuplicateOpen(true)}
          disabled={isPending}
        >
          <Copy className="size-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSaveTemplateOpen(true)}
          disabled={isPending}
        >
          <Save className="size-4" />
          Save as Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLoadTemplateOpen(true)}
          disabled={isPending}
        >
          <Upload className="size-4" />
          Load Template
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              <Trash2 className="size-4 text-destructive" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Delete &quot;{service.title}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Edit dialog */}
      <ServiceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        serviceTypes={serviceTypes}
        editService={{
          id: service.id,
          title: service.title,
          serviceDate: service.serviceDate,
          startTime: service.startTime,
          endTime: service.endTime,
          durationMinutes: service.durationMinutes,
          serviceTypeId: service.serviceTypeId,
          rehearsalDate: service.rehearsalDate,
          rehearsalTime: service.rehearsalTime,
          rehearsalNotes: service.rehearsalNotes,
          notes: service.notes,
        }}
      />

      {/* Duplicate dialog */}
      <DuplicateServiceDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        sourceService={{
          id: service.id,
          title: service.title,
          serviceDate: service.serviceDate,
        }}
      />

      {/* Save template dialog */}
      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        serviceId={service.id}
        teams={teams}
      />

      {/* Load template dialog */}
      <LoadTemplateDialog
        open={loadTemplateOpen}
        onOpenChange={setLoadTemplateOpen}
        serviceId={service.id}
        teams={teams}
        teamsWithPositions={teamsWithPositions}
      />
    </>
  );
}
