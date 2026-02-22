"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import {
  createVendor,
  updateVendor,
  deleteVendor,
} from "@/app/(dashboard)/vendors/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VendorRow = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
};

type Props = {
  vendors: VendorRow[];
};

function AddVendorDialog({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name?.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createVendor({
      name: trimmed,
      contact: contact.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setName("");
      setContact("");
      setEmail("");
      setNotes("");
      router.refresh();
      onSuccess();
    } else {
      setError(result.error ?? "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add vendor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="vendor-name">Vendor name</Label>
            <Input
              id="vendor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Studio Co"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor-contact">Contact (optional)</Label>
            <Input
              id="vendor-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact person or phone"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor-email">Email (optional)</Label>
            <Input
              id="vendor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor-notes">Notes (optional)</Label>
            <Input
              id="vendor-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief notes"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditVendorDialog({
  vendor,
  open,
  onOpenChange,
  onSuccess,
}: {
  vendor: VendorRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setContact(vendor.contact ?? "");
      setEmail(vendor.email ?? "");
      setNotes(vendor.notes ?? "");
      setError(null);
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor) return;
    const trimmed = name?.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await updateVendor(vendor.id, {
      name: trimmed,
      contact: contact.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
    });
    setIsPending(false);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
      onSuccess();
    } else {
      setError(result.error ?? "Failed to update");
    }
  };

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-vendor-name">Vendor name</Label>
            <Input
              id="edit-vendor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Studio Co"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-vendor-contact">Contact (optional)</Label>
            <Input
              id="edit-vendor-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact person or phone"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-vendor-email">Email (optional)</Label>
            <Input
              id="edit-vendor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-vendor-notes">Notes (optional)</Label>
            <Input
              id="edit-vendor-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief notes"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ManageVendorsView({ vendors: initialVendors }: Props) {
  const router = useRouter();
  const [editVendor, setEditVendor] = React.useState<VendorRow | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const openEdit = (vendor: VendorRow) => {
    setEditVendor(vendor);
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor? Existing vendor work will keep the vendor name but won’t link to this record.")) return;
    const result = await deleteVendor(id);
    if (result.success) router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Add and edit vendors. They appear in the{" "}
          <Link
            href="/vendors"
            className="font-medium underline hover:no-underline"
          >
            Outsourcing Manager
          </Link>{" "}
          when adding vendor work.
        </p>
        <AddVendorDialog onSuccess={() => {}} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">All vendors</span>
          </div>
        </CardHeader>
        <CardContent>
          {initialVendors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No vendors yet. Add one to use in the Outsourcing Manager.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Contact</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{vendor.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {vendor.contact ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {vendor.email ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {vendor.createdAt instanceof Date
                          ? vendor.createdAt.toLocaleDateString()
                          : new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => openEdit(vendor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            onClick={() => handleDelete(vendor.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditVendorDialog
        vendor={editVendor}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => setEditVendor(null)}
      />
    </div>
  );
}
