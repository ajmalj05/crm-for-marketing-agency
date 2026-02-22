"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { createAdAccount, updateAdAccountCustomFields } from "@/app/(dashboard)/ad-accounts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AdAccountWithClient = {
  id: string;
  clientId: string;
  platformName: string;
  accountId: string;
  campaignId: string | null;
  maxDailyBudget: number;
  currentBalance: number;
  currency: string | null;
  customFields: unknown;
  createdAt: Date;
  client: { id: string; name: string };
};

type Props = {
  initialAccounts: AdAccountWithClient[];
  clients: { id: string; name: string }[];
};

const LOW_BALANCE_THRESHOLD = 0.2; // Red when balance < 20% of max daily budget

function getHealth(account: AdAccountWithClient): "green" | "red" {
  const threshold = account.maxDailyBudget * LOW_BALANCE_THRESHOLD;
  return account.currentBalance >= threshold ? "green" : "red";
}

function getCustomFieldsMap(account: AdAccountWithClient): Record<string, string> {
  const raw = account.customFields as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v == null ? "" : String(v);
  }
  return out;
}

function AdAccountEditSheet({
  account,
  open,
  onOpenChange,
  onSaved,
}: {
  account: AdAccountWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [customFields, setCustomFields] = React.useState<Record<string, string>>({});
  const [newKey, setNewKey] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (!account) return;
    setCustomFields(getCustomFieldsMap(account));
    setNewKey("");
  }, [account]);

  const save = async () => {
    if (!account) return;
    setIsPending(true);
    const obj = Object.fromEntries(
      Object.entries(customFields).filter(([, v]) => v.trim() !== "")
    );
    const result = await updateAdAccountCustomFields(
      account.id,
      Object.keys(obj).length ? obj : null
    );
    setIsPending(false);
    if (result.success) {
      onSaved();
      router.refresh();
      onOpenChange(false);
    }
  };

  if (!account) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Custom columns — {account.client.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add key-value pairs (e.g. Target Cost Per Lead). They appear as columns in the table.
          </p>
          {Object.entries(customFields).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <Input
                className="flex-1"
                value={value}
                onChange={(e) =>
                  setCustomFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={key}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCustomFields((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Column name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newKey.trim()) {
                    setCustomFields((prev) => ({ ...prev, [newKey.trim()]: "" }));
                    setNewKey("");
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (newKey.trim()) {
                  setCustomFields((prev) => ({ ...prev, [newKey.trim()]: "" }));
                  setNewKey("");
                }
              }}
            >
              Add column
            </Button>
          </div>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddAdAccountDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [platformName, setPlatformName] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [campaignId, setCampaignId] = React.useState("");
  const [maxDailyBudget, setMaxDailyBudget] = React.useState("");
  const [currentBalance, setCurrentBalance] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const max = parseFloat(maxDailyBudget);
    const balance = parseFloat(currentBalance);
    if (!clientId || !platformName.trim() || !accountId.trim() || isNaN(max) || max < 0 || isNaN(balance) || balance < 0) {
      setError("Client, platform, account ID, max daily budget, and current balance are required (≥ 0).");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createAdAccount({
      clientId,
      platformName: platformName.trim(),
      accountId: accountId.trim(),
      campaignId: campaignId.trim() || null,
      maxDailyBudget: max,
      currentBalance: balance,
      currency: currency.trim() || "USD",
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setClientId("");
      setPlatformName("");
      setAccountId("");
      setCampaignId("");
      setMaxDailyBudget("");
      setCurrentBalance("");
      setCurrency("USD");
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
          Add ad account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add ad account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="aa-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="aa-client">
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
            <Label htmlFor="aa-platform">Platform name</Label>
            <Input
              id="aa-platform"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="e.g. Meta, Google"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aa-account">Account ID</Label>
            <Input
              id="aa-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. act_123456"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aa-campaign">Campaign ID (optional)</Label>
            <Input
              id="aa-campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aa-max">Max daily budget</Label>
              <Input
                id="aa-max"
                type="number"
                step="0.01"
                min="0"
                value={maxDailyBudget}
                onChange={(e) => setMaxDailyBudget(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aa-balance">Current balance</Label>
              <Input
                id="aa-balance"
                type="number"
                step="0.01"
                min="0"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aa-currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="aa-currency">
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

export function AdsMonitorView({ initialAccounts, clients }: Props) {
  const [editingAccount, setEditingAccount] = React.useState<AdAccountWithClient | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const allCustomKeys = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of initialAccounts) {
      const map = getCustomFieldsMap(a);
      Object.keys(map).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [initialAccounts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Track ad accounts by client. Health is red when balance &lt; 20% of max daily budget.
        </p>
        <AddAdAccountDialog clients={clients} />
      </div>
      <div className="rounded-md border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Health</th>
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-left font-medium">Account ID</th>
              <th className="px-4 py-3 text-left font-medium">Campaign ID</th>
              <th className="px-4 py-3 text-right font-medium">Max daily budget</th>
              <th className="px-4 py-3 text-right font-medium">Current balance</th>
              <th className="px-4 py-3 text-left font-medium">Currency</th>
              {allCustomKeys.map((k) => (
                <th key={k} className="px-4 py-3 text-left font-medium">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialAccounts.map((account) => {
              const health = getHealth(account);
              const custom = getCustomFieldsMap(account);
              return (
                <tr
                  key={account.id}
                  className={cn(
                    "border-b border-border/50",
                    health === "red" && "bg-red-50 dark:bg-red-950/20"
                  )}
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full",
                        health === "green" && "bg-green-500",
                        health === "red" && "bg-red-500"
                      )}
                      title={health === "red" ? "Low balance" : "Good"}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingAccount(account);
                        setSheetOpen(true);
                      }}
                      aria-label="Edit custom columns"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="px-4 py-3">{account.client.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{account.accountId}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {account.campaignId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {account.maxDailyBudget.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {account.currentBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{account.currency ?? "USD"}</td>
                  {allCustomKeys.map((k) => (
                    <td key={k} className="max-w-[120px] truncate px-4 py-3 text-muted-foreground">
                      {custom[k] ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        {initialAccounts.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No ad accounts yet.</p>
        )}
      </div>

      <AdAccountEditSheet
        account={editingAccount}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSaved={() => {}}
      />
    </div>
  );
}
