"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Building2 } from "lucide-react";
import { createClient, updateClient } from "@/app/(dashboard)/clients/actions";
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
import { cn } from "@/lib/utils";

export type ClientRow = {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
};

type Props = {
  clients: ClientRow[];
};

function AddClientDialog({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
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
    const result = await createClient({ name: trimmed });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setName("");
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
          Add client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Client name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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

function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: {
  client: ClientRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (client) {
      setName(client.name);
      setError(null);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;
    const trimmed = name?.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await updateClient({ id: client.id, name: trimmed });
    setIsPending(false);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
      onSuccess();
    } else {
      setError(result.error ?? "Failed to update");
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-client-name">Client name</Label>
            <Input
              id="edit-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

export function ClientsView({ clients: initialClients }: Props) {
  const router = useRouter();
  const [editClient, setEditClient] = React.useState<ClientRow | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const handleToggleActive = async (client: ClientRow) => {
    const result = await updateClient({ id: client.id, active: !client.active });
    if (result.success) router.refresh();
  };

  const openEdit = (client: ClientRow) => {
    setEditClient(client);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Manage clients used across Production Hub, Financials, Vendors, Ads Monitor, and IT Vault.
        </p>
        <AddClientDialog onSuccess={() => {}} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">All clients</span>
          </div>
        </CardHeader>
        <CardContent>
          {initialClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No clients yet. Add one to use in tasks, invoices, and other modules.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialClients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{client.name}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            client.active
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {client.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {client.createdAt instanceof Date
                          ? client.createdAt.toLocaleDateString()
                          : new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(client)}
                            aria-label={client.active ? "Deactivate" : "Activate"}
                          >
                            {client.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => openEdit(client)}
                          >
                            <Pencil className="h-4 w-4" />
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

      <EditClientDialog
        client={editClient}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => setEditClient(null)}
      />
    </div>
  );
}
