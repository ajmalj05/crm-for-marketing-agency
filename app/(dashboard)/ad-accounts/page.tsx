import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getActiveClientsForSelect } from "@/lib/clients";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption } from "@/lib/types";
import type { AdAccount } from "@/lib/types";
import { AdsMonitorView } from "@/components/ads-monitor-view";

async function getAdAccounts(): Promise<(AdAccount & { client: ClientOption })[]> {
  try {
    const db = await getDb();
    const accounts = await db
      .collection("AdAccount")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    if (accounts.length === 0) return [];
    const clientIds = Array.from(new Set(accounts.map((a) => a.clientId)));
    const clientObjectIds = clientIds.map((id) => new ObjectId(id));
    const clientDocs = await db
      .collection("Client")
      .find({ _id: { $in: clientObjectIds } })
      .toArray();
    const clientMap = new Map<string, ClientOption>();
    for (const c of clientDocs) {
      const { id, name } = fromMongoDoc(c);
      clientMap.set(id, { id, name });
    }
    return accounts.map((a) => {
      const row = fromMongoDoc(a) as AdAccount;
      const client = clientMap.get(a.clientId) ?? { id: a.clientId, name: "Unknown" };
      return { ...row, client };
    });
  } catch {
    return [];
  }
}

export default async function AdAccountsPage() {
  const [adAccounts, clients] = await Promise.all([
    getAdAccounts(),
    getActiveClientsForSelect(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ads Monitor</h1>
      <AdsMonitorView initialAccounts={adAccounts} clients={clients} />
    </div>
  );
}
