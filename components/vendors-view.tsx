"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { VendorWorkStatus } from "@/lib/types";
import { createVendorWork } from "@/app/(dashboard)/vendors/actions";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const VENDOR_WORK_STATUSES: VendorWorkStatus[] = [
  "Not Started",
  "Advance Paid",
  "In Progress",
  "Completed",
  "Paid",
  "Unpaid",
];

type VendorWorkWithClient = {
  id: string;
  vendorId: string | null;
  vendorName: string;
  clientId: string;
  taskDescription: string;
  projectName: string | null;
  cost: number;
  currency: string;
  amountChargedToClient: number | null;
  advanceAmount: number;
  advancePaidAt: Date | null;
  status: VendorWorkStatus;
  createdAt: Date;
  client: { id: string; name: string };
};

type Props = {
  initialVendorWorks: VendorWorkWithClient[];
  clients: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
};

function formatMoney(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function AddVendorWorkDialog({
  clients,
  vendors,
}: {
  clients: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [vendorId, setVendorId] = React.useState("");
  const [vendorName, setVendorName] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [amountChargedToClient, setAmountChargedToClient] = React.useState("");
  const [advanceAmount, setAdvanceAmount] = React.useState("");
  const [advancePaidAt, setAdvancePaidAt] = React.useState("");
  const [status, setStatus] = React.useState<VendorWorkStatus>("Not Started");

  const selectedVendorName =
    vendorId && vendorId !== "__other__"
      ? vendors.find((v) => v.id === vendorId)?.name
      : null;
  const nameToUse = selectedVendorName || vendorName.trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const costNum = parseFloat(cost);
    const chargedNum = amountChargedToClient.trim()
      ? parseFloat(amountChargedToClient)
      : null;
    const advanceNum = advanceAmount.trim() ? parseFloat(advanceAmount) : 0;
    if (
      !clientId ||
      !nameToUse.trim() ||
      !taskDescription.trim() ||
      isNaN(costNum) ||
      costNum < 0
    ) {
      setError("Please fill client, vendor, task, and cost (≥ 0).");
      return;
    }
    if (chargedNum !== null && (isNaN(chargedNum) || chargedNum < 0)) {
      setError("Amount charged must be a non-negative number or empty.");
      return;
    }
    if (isNaN(advanceNum) || advanceNum < 0 || advanceNum > costNum) {
      setError("Advance amount must be between 0 and cost.");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createVendorWork({
      clientId,
      vendorId: vendorId && vendorId !== "__other__" ? vendorId : null,
      vendorName: nameToUse.trim(),
      taskDescription: taskDescription.trim(),
      projectName: projectName.trim() || null,
      cost: costNum,
      currency: "INR",
      amountChargedToClient: chargedNum,
      advanceAmount: advanceNum,
      advancePaidAt: advancePaidAt.trim()
        ? new Date(advancePaidAt)
        : null,
      status,
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setClientId("");
      setVendorId("");
      setVendorName("");
      setTaskDescription("");
      setProjectName("");
      setCost("");
      setAmountChargedToClient("");
      setAdvanceAmount("");
      setAdvancePaidAt("");
      setStatus("Not Started");
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
          Add vendor work
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add vendor work</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="vw-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="vw-client">
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
          <div className="grid gap-2">
            <Label htmlFor="vw-vendor">Vendor</Label>
            <Select
              value={vendorId || "__other__"}
              onValueChange={(v) => {
                if (v === "__other__") {
                  setVendorId("");
                  setVendorName("");
                } else {
                  setVendorId(v);
                  const vendor = vendors.find((x) => x.id === v);
                  setVendorName(vendor?.name ?? "");
                }
              }}
            >
              <SelectTrigger id="vw-vendor">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
                <SelectItem value="__other__">Other (type name below)</SelectItem>
              </SelectContent>
            </Select>
            {(vendorId === "" || vendorId === "__other__") && (
              <Input
                placeholder="Vendor name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required={vendors.length === 0}
              />
            )}
            {vendors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                <Link
                  href="/vendors/manage"
                  className="underline hover:no-underline"
                >
                  Manage Vendors
                </Link>{" "}
                to add vendors to the list.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vw-task">Task description</Label>
            <Input
              id="vw-task"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="e.g. Logo design"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vw-project">Project name (optional)</Label>
            <Input
              id="vw-project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Website Redesign"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vw-cost">Cost (INR)</Label>
              <Input
                id="vw-cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vw-charged">Amount charged to client (optional)</Label>
              <Input
                id="vw-charged"
                type="number"
                step="0.01"
                min="0"
                value={amountChargedToClient}
                onChange={(e) => setAmountChargedToClient(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vw-advance">Advance amount (INR)</Label>
              <Input
                id="vw-advance"
                type="number"
                step="0.01"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vw-advance-date">Advance paid date (optional)</Label>
              <Input
                id="vw-advance-date"
                type="date"
                value={advancePaidAt}
                onChange={(e) => setAdvancePaidAt(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vw-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as VendorWorkStatus)}
            >
              <SelectTrigger id="vw-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_WORK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
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

function statusBadgeClass(status: VendorWorkStatus): string {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-800";
    case "Unpaid":
    case "Not Started":
      return "bg-amber-100 text-amber-800";
    case "Advance Paid":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-sky-100 text-sky-800";
    case "Completed":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function VendorsView({
  initialVendorWorks,
  clients,
  vendors,
}: Props) {
  const [selectedVendor, setSelectedVendor] = React.useState<string | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const byVendor = React.useMemo(() => {
    const map = new Map<string, VendorWorkWithClient[]>();
    for (const w of initialVendorWorks) {
      const name = w.vendorName;
      const list = map.get(name) ?? [];
      list.push(w);
      map.set(name, list);
    }
    return map;
  }, [initialVendorWorks]);

  const vendorSummaries = React.useMemo(() => {
    return Array.from(byVendor.entries()).map(([name, works]) => {
      const totalCost = works.reduce((s, w) => s + w.cost, 0);
      const totalCharged = works.reduce(
        (s, w) => s + (w.amountChargedToClient ?? 0),
        0
      );
      const totalAdvance = works.reduce((s, w) => s + (w.advanceAmount ?? 0), 0);
      const paid = works.filter((w) => w.status === "Paid").length;
      const unpaid = works.length - paid;
      return {
        name,
        totalCost,
        totalCharged,
        totalAdvance,
        margin: totalCharged - totalCost,
        count: works.length,
        paid,
        unpaid,
        works,
      };
    });
  }, [byVendor]);

  const openVendor = (name: string) => {
    setSelectedVendor(name);
    setSheetOpen(true);
  };

  const summary = selectedVendor
    ? vendorSummaries.find((s) => s.name === selectedVendor)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Track outsourced work by vendor (INR). Click a card to see the
          ledger.{" "}
          <Link
            href="/vendors/manage"
            className="font-medium underline hover:no-underline"
          >
            Manage Vendors
          </Link>
        </p>
        <AddVendorWorkDialog clients={clients} vendors={vendors} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendorSummaries.map((s) => (
          <Card
            key={s.name}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => openVendor(s.name)}
          >
            <CardHeader className="pb-2">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.count} job{s.count !== 1 ? "s" : ""} · {s.paid} paid, {s.unpaid} unpaid
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">
                Total cost: {formatMoney(s.totalCost, "INR")}
                {s.totalAdvance > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    · Advance: {formatMoney(s.totalAdvance, "INR")}
                  </span>
                )}
                {s.totalCharged > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    · Margin: {formatMoney(s.margin, "INR")}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {vendorSummaries.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No vendor work yet. Add vendors in{" "}
          <Link
            href="/vendors/manage"
            className="font-medium underline hover:no-underline"
          >
            Manage Vendors
          </Link>{" "}
          then add vendor work above.
        </p>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-2xl"
        >
          <SheetHeader>
            <SheetTitle>{selectedVendor ?? "Vendor"}</SheetTitle>
          </SheetHeader>
          {summary && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  Total cost: {formatMoney(summary.totalCost, "INR")}
                </span>
                {summary.totalAdvance > 0 && (
                  <span>
                    Advance paid: {formatMoney(summary.totalAdvance, "INR")}
                  </span>
                )}
                {summary.totalCharged > 0 && (
                  <span>
                    Total charged to clients:{" "}
                    {formatMoney(summary.totalCharged, "INR")}
                  </span>
                )}
                {summary.totalCharged > 0 && (
                  <span className="font-medium">
                    Agency margin: {formatMoney(summary.margin, "INR")}
                  </span>
                )}
              </div>
              <div className="rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Client</th>
                      <th className="px-3 py-2 text-left font-medium">Project</th>
                      <th className="px-3 py-2 text-left font-medium">Task</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                      <th className="px-3 py-2 text-right font-medium">Advance</th>
                      <th className="px-3 py-2 text-right font-medium">Balance</th>
                      <th className="px-3 py-2 text-right font-medium">Charged</th>
                      <th className="px-3 py-2 text-right font-medium">Margin</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.works.map((w) => {
                      const charged = w.amountChargedToClient ?? 0;
                      const margin = charged > 0 ? charged - w.cost : null;
                      const advance = w.advanceAmount ?? 0;
                      const balance = w.cost - advance;
                      const cur = w.currency ?? "INR";
                      return (
                        <tr
                          key={w.id}
                          className="border-b border-border/50"
                        >
                          <td className="px-3 py-2">{w.client.name}</td>
                          <td className="max-w-[100px] truncate px-3 py-2">
                            {w.projectName ?? "—"}
                          </td>
                          <td
                            className="max-w-[120px] truncate px-3 py-2"
                            title={w.taskDescription}
                          >
                            {w.taskDescription}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatMoney(w.cost, cur)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {advance > 0 ? (
                              <>
                                {formatMoney(advance, cur)}
                                {w.advancePaidAt && (
                                  <span className="block text-xs text-muted-foreground">
                                    {new Date(w.advancePaidAt).toLocaleDateString()}
                                  </span>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {balance > 0 ? formatMoney(balance, cur) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {charged > 0 ? formatMoney(charged, cur) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {margin !== null ? formatMoney(margin, cur) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-xs",
                                statusBadgeClass(w.status)
                              )}
                            >
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
