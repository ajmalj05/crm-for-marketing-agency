import { getDb } from "@/lib/db";
import { fromMongoDoc } from "@/lib/types";
import type { Client } from "@/lib/types";
import { ClientsView } from "@/components/clients-view";

async function getClients(): Promise<Client[]> {
  try {
    const db = await getDb();
    const cursor = db.collection("Client").find({}).sort({ name: 1 });
    const docs = await cursor.toArray();
    return docs.map((d) => fromMongoDoc(d) as Client);
  } catch {
    return [];
  }
}

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <ClientsView clients={clients} />
    </div>
  );
}
