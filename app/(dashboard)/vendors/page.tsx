import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getActiveClientsForSelect } from "@/lib/clients";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption, VendorOption, VendorWork } from "@/lib/types";
import { VendorsView } from "@/components/vendors-view";

async function getVendorWorks(): Promise<(VendorWork & { client: ClientOption })[]> {
  try {
    const db = await getDb();
    const works = await db
      .collection("VendorWork")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    if (works.length === 0) return [];
    const clientIds = Array.from(
      new Set(works.map((w) => (w as unknown as { clientId: string }).clientId))
    );
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
    return works.map((w) => {
      const row = fromMongoDoc(w) as VendorWork;
      const client = clientMap.get(w.clientId) ?? { id: w.clientId, name: "Unknown" };
      return {
        ...row,
        client,
        vendorId: row.vendorId ?? null,
        currency: row.currency ?? "INR",
        projectName: row.projectName ?? null,
        advanceAmount: row.advanceAmount ?? 0,
        advancePaidAt: row.advancePaidAt ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getVendorsForSelect(): Promise<VendorOption[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection("Vendor")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return docs.map((d) => {
      const { id, name } = fromMongoDoc(d);
      return { id, name };
    });
  } catch {
    return [];
  }
}

export default async function VendorsPage() {
  const [vendorWorks, clients, vendors] = await Promise.all([
    getVendorWorks(),
    getActiveClientsForSelect(),
    getVendorsForSelect(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Outsourcing Manager</h1>
      <VendorsView
        initialVendorWorks={vendorWorks}
        clients={clients}
        vendors={vendors}
      />
    </div>
  );
}
