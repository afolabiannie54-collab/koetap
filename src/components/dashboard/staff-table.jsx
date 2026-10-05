"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Pencil, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormError } from "@/components/auth/form-error";
import { Avatar } from "@/components/ui/koetap/avatar";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { useToast } from "@/components/ui/koetap/toast";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { StaffDialog } from "@/components/dashboard/staff-dialog";
import { cn } from "@/lib/utils";

// Icon-only with a tooltip (the label stays for screen readers), so rows fit on a phone without scrolling.
function RowAction({ label, icon: Icon, onClick, variant = "ghost", tone, disabled }) {
  return (
    <KTooltip label={label} align="end">
      <Button size="sm" variant={variant} onClick={onClick} disabled={disabled} aria-label={label} className={cn("size-8 px-0 sm:size-9", tone === "danger" && "text-error-ink hover:bg-error-soft")}>
        <Icon />
        <span className="sr-only">{label}</span>
      </Button>
    </KTooltip>
  );
}

export function StaffTable({ storeId, staff }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [dialog, setDialog] = useState(null); // "new" or a staff member
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function toggleActive(member) {
    if (
      member.isActive &&
      !(await confirm({
        title: `Deactivate ${member.name}?`,
        description: `${member.name} will be signed out straight away and won't be able to log in or use the POS. Their past sales stay on record, and you can reactivate them any time.`,
        confirmLabel: "Deactivate",
        destructive: true,
      }))
    ) {
      return;
    }

    setActionError("");
    setBusyId(member.id);
    const res = await fetch(`/api/stores/${storeId}/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    setBusyId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Could not update the cashier");
      return;
    }
    toast.success(`${member.name} ${member.isActive ? "deactivated" : "reactivated"}`);
    router.refresh();
  }

  // Only offered once a cashier has been deactivated: that is the deliberate first step.
  async function deleteForever(member) {
    const ok = await confirm({
      title: `Delete ${member.name} permanently?`,
      description: "Their sign-in is removed for good and can't be restored. Sales they made stay in your reports under their name.",
      confirmLabel: "Delete permanently",
      destructive: true,
    });
    if (!ok) return;

    setActionError("");
    setBusyId(member.id);
    const res = await fetch(`/api/stores/${storeId}/staff/${member.id}?permanent=true`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Could not delete the cashier");
      return;
    }
    toast.success(`${member.name} deleted`);
    router.refresh();
  }

  const addButton = (
    <Button onClick={() => setDialog("new")}>
      <Plus />
      Add Cashier
    </Button>
  );

  return (
    <div className="animate-contentIn space-y-5">
      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="No staff yet. Add your first cashier to get started."
        >
          {addButton}
        </EmptyState>
      ) : (
        <>
          <div className="flex justify-end">{addButton}</div>

          {actionError && <FormError>{actionError}</FormError>}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((m) => (
                  <TableRow key={m.id} className={cn(!m.isActive && "opacity-60")}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} email={m.email} className="max-sm:hidden" />
                        <div className="min-w-0">
                          <p className="font-medium [overflow-wrap:anywhere]">{m.name}</p>
                          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere] md:hidden">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{m.email}</TableCell>
                    <TableCell>
                      <KBadge variant={m.isActive ? "active" : "inactive"}>{m.isActive ? "Active" : "Inactive"}</KBadge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{m.dateAdded}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <RowAction label="Edit" icon={Pencil} onClick={() => setDialog(m)} />
                        <RowAction
                          label={m.isActive ? "Deactivate" : "Reactivate"}
                          icon={m.isActive ? Ban : RotateCcw}
                          variant="ghost"
                          tone={m.isActive ? "danger" : undefined}
                          disabled={busyId === m.id}
                          onClick={() => toggleActive(m)}
                        />
                        {!m.isActive && (
                          <RowAction
                            label="Delete permanently: this can't be undone"
                            icon={Trash2}
                            tone="danger"
                            disabled={busyId === m.id}
                            onClick={() => deleteForever(m)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {dialog && (
        <StaffDialog storeId={storeId} member={dialog === "new" ? undefined : dialog} onClose={() => setDialog(null)} />
      )}
      {confirmDialog}
    </div>
  );
}
