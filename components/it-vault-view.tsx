"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Copy, RefreshCw, Plus } from "lucide-react";
import type { ITPlatformType } from "@/lib/types";
import { createITCredential, revealPassword } from "@/app/(dashboard)/it-credentials/actions";
import { Button } from "@/components/ui/button";
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

type ITCredentialWithClient = {
  id: string;
  clientId: string;
  platformType: ITPlatformType;
  providerName: string;
  renewalDate: Date;
  notificationEmail: string;
  loginEmail: string | null;
  passwordEncrypted: string | null;
  createdAt: Date;
  client: { id: string; name: string };
};

type Props = {
  initialCredentials: ITCredentialWithClient[];
  clients: { id: string; name: string }[];
};

function AddCredentialDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [platformType, setPlatformType] = React.useState<ITPlatformType>("Domain");
  const [providerName, setProviderName] = React.useState("");
  const [renewalDate, setRenewalDate] = React.useState("");
  const [notificationEmail, setNotificationEmail] = React.useState("");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clientId || !providerName.trim() || !notificationEmail.trim() || !renewalDate) {
      setError("Client, provider name, notification email, and renewal date are required.");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createITCredential({
      clientId,
      platformType,
      providerName: providerName.trim(),
      renewalDate,
      notificationEmail: notificationEmail.trim(),
      loginEmail: loginEmail.trim() || null,
      password: password.trim() || null,
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setClientId("");
      setPlatformType("Domain");
      setProviderName("");
      setRenewalDate("");
      setNotificationEmail("");
      setLoginEmail("");
      setPassword("");
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
          Add credential
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add credential</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="it-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="it-client">
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
            <Label htmlFor="it-type">Platform type</Label>
            <Select value={platformType} onValueChange={(v) => setPlatformType(v as ITPlatformType)}>
              <SelectTrigger id="it-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Domain">Domain</SelectItem>
                <SelectItem value="Hosting">Hosting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="it-provider">Provider name</Label>
            <Input
              id="it-provider"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. Namecheap, Cloudflare"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="it-renewal">Renewal date</Label>
            <Input
              id="it-renewal"
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="it-notify">Notification email</Label>
            <Input
              id="it-notify"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="e.g. agencygrowith@gmail.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="it-login">Login email (optional)</Label>
            <Input
              id="it-login"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="it-password">Password (optional, stored encrypted)</Label>
            <Input
              id="it-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="—"
              autoComplete="new-password"
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

export function ITVaultView({ initialCredentials, clients }: Props) {
  const router = useRouter();
  const [revealedId, setRevealedId] = React.useState<string | null>(null);
  const [passwordValue, setPasswordValue] = React.useState<string | null>(null);
  const [renewalCheckPending, setRenewalCheckPending] = React.useState(false);
  const [renewalMessage, setRenewalMessage] = React.useState<string | null>(null);

  const reveal = async (cred: ITCredentialWithClient) => {
    if (revealedId === cred.id) {
      setRevealedId(null);
      setPasswordValue(null);
      return;
    }
    if (!cred.passwordEncrypted) {
      setRevealedId(cred.id);
      setPasswordValue("");
      return;
    }
    const result = await revealPassword(cred.id);
    if (result.error) {
      setRenewalMessage(result.error);
      return;
    }
    setRevealedId(cred.id);
    setPasswordValue(result.value);
  };

  const copyPassword = (value: string) => {
    if (value) navigator.clipboard.writeText(value);
  };

  const checkRenewals = async () => {
    setRenewalCheckPending(true);
    setRenewalMessage(null);
    try {
      const res = await fetch("/api/it-renewals");
      const data = await res.json();
      if (data.sent) {
        setRenewalMessage(`Email sent. ${data.count} item(s) expiring in 15 days.`);
      } else if (data.count !== undefined) {
        setRenewalMessage(
          data.message || `${data.count} item(s) expiring in 15 days. Set RESEND_API_KEY to send email.`
        );
      } else {
        setRenewalMessage(data.message || "Done.");
      }
    } catch {
      setRenewalMessage("Request failed.");
    } finally {
      setRenewalCheckPending(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={checkRenewals}
            disabled={renewalCheckPending}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", renewalCheckPending && "animate-spin")} />
            Check renewals (15 days)
          </Button>
          <AddCredentialDialog clients={clients} />
        </div>
        {renewalMessage && (
          <p className="text-sm text-muted-foreground">{renewalMessage}</p>
        )}
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Platform</th>
                <th className="px-4 py-3 text-left font-medium">Renewal date</th>
                <th className="px-4 py-3 text-left font-medium">Login email</th>
                <th className="px-4 py-3 text-left font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              {initialCredentials.map((cred) => {
                const isRevealed = revealedId === cred.id;
                const value = revealedId === cred.id ? passwordValue : null;
                const loginEmail = cred.loginEmail || cred.notificationEmail || "—";
                return (
                  <tr key={cred.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3">{cred.client.name}</td>
                    <td className="px-4 py-3">
                      {cred.providerName} ({cred.platformType})
                    </td>
                    <td className="px-4 py-3">
                      {cred.renewalDate instanceof Date
                        ? cred.renewalDate.toLocaleDateString()
                        : new Date(cred.renewalDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{loginEmail}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cred.passwordEncrypted ? (
                          <>
                            <span className="font-mono">
                              {isRevealed && value !== null ? (
                                <span className="text-foreground">{value}</span>
                              ) : (
                                <span className="text-muted-foreground">••••••••</span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => reveal(cred)}
                              aria-label={isRevealed ? "Hide password" : "Reveal password"}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            {isRevealed && value && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyPassword(value)}
                                aria-label="Copy password"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {initialCredentials.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No credentials yet.</p>
        )}
      </div>
    </div>
  );
}
