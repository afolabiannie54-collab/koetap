"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffDialog } from "@/components/dashboard/staff-dialog";
import { cn } from "@/lib/utils";

export function StaffTable({ storeId, staff }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(null); // "new" or a staff member
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function toggleActive(member) {
    if (member.isActive && !window.confirm(`Deactivate ${member.name}? They will be signed out and unable to log in.`)) {
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
    router.refresh();
  }

  const addButton = (
    <Button onClick={() => setDialog("new")}>
      <Plus data-icon="inline-start" />
      Add Cashier
    </Button>
  );

  return (
    <div className="space-y-4">
      {staff.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            No staff yet. Add your first cashier to get started.
          </p>
          {addButton}
        </div>
      ) : (
        <>
          <div className="flex justify-end">{addButton}</div>

          {actionError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          )}

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((m) => (
                  <TableRow key={m.id} className={cn(!m.isActive && "opacity-60")}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      <Badge variant={m.isActive ? "default" : "secondary"}>
                        {m.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{m.dateAdded}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setDialog(m)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={m.isActive ? "destructive" : "secondary"}
                          disabled={busyId === m.id}
                          onClick={() => toggleActive(m)}
                        >
                          {m.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
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
        <StaffDialog
          storeId={storeId}
          member={dialog === "new" ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
