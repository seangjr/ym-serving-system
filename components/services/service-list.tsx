"use client";

import { format, parseISO } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type AppRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { deleteService } from "@/lib/services/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceListService {
  id: string;
  title: string;
  serviceDate: string;
  startTime: string;
  endTime?: string;
  serviceType?: { id: string; name: string; label: string; color: string };
  isCancelled: boolean;
}

interface ServiceListProps {
  services: ServiceListService[];
  userRole: AppRole;
  serviceTypes: { id: string; name: string; label: string; color: string }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceList({
  services,
  userRole,
  serviceTypes,
}: ServiceListProps) {
  const [editingService, setEditingService] =
    useState<ServiceListService | null>(null);
  const [isPending, startTransition] = useTransition();
  const canManage = isAdminOrCommittee(userRole);

  function handleDelete(serviceId: string) {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;

    startTransition(async () => {
      const result = await deleteService(serviceId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Service deleted");
    });
  }

  if (services.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No upcoming services
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="group relative flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
          >
            <Link
              href={`/services/${service.id}`}
              className="absolute inset-0 z-0"
            >
              <span className="sr-only">View {service.title}</span>
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {service.title}
                </span>
                {service.isCancelled && (
                  <Badge variant="destructive" className="text-[10px]">
                    Cancelled
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {format(parseISO(service.serviceDate), "EEE, MMM d")}
                {" at "}
                {service.startTime}
                {service.endTime && ` - ${service.endTime}`}
              </p>

              {service.serviceType && (
                <Badge
                  variant="secondary"
                  className="mt-0.5 w-fit text-[10px]"
                  style={{
                    backgroundColor: `${service.serviceType.color}20`,
                    color: service.serviceType.color,
                    borderColor: `${service.serviceType.color}40`,
                  }}
                >
                  {service.serviceType.label}
                </Badge>
              )}

              <p className="mt-1 text-[10px] text-muted-foreground/70">
                Assignments: Coming in Phase 4
              </p>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative z-10 size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    disabled={isPending}
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditingService(service)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => handleDelete(service.id)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      {editingService && (
        <ServiceFormDialog
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) setEditingService(null);
          }}
          serviceTypes={serviceTypes}
          editService={{
            id: editingService.id,
            title: editingService.title,
            serviceDate: editingService.serviceDate,
            startTime: editingService.startTime,
            endTime: editingService.endTime,
            serviceTypeId: editingService.serviceType?.id,
          }}
        />
      )}
    </>
  );
}
