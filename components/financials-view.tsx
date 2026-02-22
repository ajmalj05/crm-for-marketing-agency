"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { InvoiceStatus, InvoiceType } from "@/lib/types";
import { createInvoice } from "@/app/(dashboard)/invoices/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type InvoiceWithClient = {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: InvoiceStatus;
  type: InvoiceType;
  description?: string | null;
  createdAt: Date;
  client: { id: string; name: string };
};

type Props = {
  initialInvoices: InvoiceWithClient[];
  clients: { id: string; name: string }[];
  metrics: { mrr: number; outstanding: number; extraWorkRevenue: number };
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function AddExtraWorkForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [dueDate, setDueDate] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!clientId || !dueDate || isNaN(num) || num <= 0) {
      setError("Please fill client, amount, and due date.");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createInvoice({
      clientId,
      amount: num,
      currency,
      dueDate,
      description: description.trim() || null,
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setClientId("");
      setAmount("");
      setDueDate("");
      setDescription("");
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Extra Work
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Extra Work</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ew-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="ew-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ew-amount">Amount</Label>
              <Input
                id="ew-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ew-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="ew-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="QAR">QAR</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ew-due">Due date</Label>
            <Input
              id="ew-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ew-desc">Description (optional)</Label>
            <Input
              id="ew-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Brochure design"
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

export function FinancialsView({ initialInvoices, clients, metrics }: Props) {
  const [groupBy, setGroupBy] = React.useState<"none" | "client" | "status">("none");

  const rows = React.useMemo(() => {
    if (groupBy === "client") {
      const byClient = new Map<string, InvoiceWithClient[]>();
      for (const inv of initialInvoices) {
        const list = byClient.get(inv.clientId) ?? [];
        list.push(inv);
        byClient.set(inv.clientId, list);
      }
      return Array.from(byClient.entries()).flatMap(([_, list]) => list);
    }
    if (groupBy === "status") {
      const order: InvoiceStatus[] = ["Pending", "Paid", "RefundRequested"];
      const byStatus = new Map<InvoiceStatus, InvoiceWithClient[]>();
      for (const inv of initialInvoices) {
        const list = byStatus.get(inv.status) ?? [];
        list.push(inv);
        byStatus.set(inv.status, list);
      }
      return order.flatMap((s) => byStatus.get(s) ?? []);
    }
    return initialInvoices;
  }, [initialInvoices, groupBy]);

  const statusLabel = (s: InvoiceStatus) =>
    s === "RefundRequested" ? "Need Refund" : s === "Pending" ? "Not Yet" : s;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total MRR</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatMoney(metrics.mrr, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Outstanding Payments</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatMoney(metrics.outstanding, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Extra Work Revenue</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatMoney(metrics.extraWorkRevenue, "USD")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="client">Group by client</SelectItem>
            <SelectItem value="status">Group by status</SelectItem>
          </SelectContent>
        </Select>
        <AddExtraWorkForm clients={clients} />
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Due date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{inv.client.name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.dueDate instanceof Date
                      ? inv.dueDate.toLocaleDateString()
                      : new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs",
                        inv.status === "Paid" && "bg-green-100 text-green-800",
                        inv.status === "Pending" && "bg-amber-100 text-amber-800",
                        inv.status === "RefundRequested" && "bg-red-100 text-red-800"
                      )}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.type}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                    {inv.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No invoices yet.</p>
        )}
      </div>
    </div>
  );
}
