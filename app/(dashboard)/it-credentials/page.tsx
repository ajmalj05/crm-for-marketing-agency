import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getActiveClientsForSelect } from "@/lib/clients";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption } from "@/lib/types";
import type { ITCredential } from "@/lib/types";
import { ITVaultView } from "@/components/it-vault-view";

async function getCredentials(): Promise<(ITCredential & { client: ClientOption })[]> {
  try {
    const db = await getDb();
    const credentials = await db
      .collection("ITCredential")
      .find({})
      .sort({ renewalDate: 1 })
      .toArray();
    if (credentials.length === 0) return [];
    const clientIds = Array.from(new Set(credentials.map((c) => c.clientId)));
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
    return credentials.map((cred) => {
      const row = fromMongoDoc(cred) as ITCredential;
      const client = clientMap.get(cred.clientId) ?? { id: cred.clientId, name: "Unknown" };
      return { ...row, client };
    });
  } catch {
    return [];
  }
}

export default async function ITCredentialsPage() {
  const [credentials, clients] = await Promise.all([
    getCredentials(),
    getActiveClientsForSelect(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">IT Vault</h1>
      <ITVaultView initialCredentials={credentials} clients={clients} />
    </div>
  );
}
