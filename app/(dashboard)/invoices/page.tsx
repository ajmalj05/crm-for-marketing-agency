import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getActiveClientsForSelect } from "@/lib/clients";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption } from "@/lib/types";
import type { Invoice } from "@/lib/types";
import { FinancialsView } from "@/components/financials-view";

async function getInvoices(): Promise<(Invoice & { client: ClientOption })[]> {
  try {
    const db = await getDb();
    const invoices = await db
      .collection("Invoice")
      .find({})
      .sort({ dueDate: 1 })
      .toArray();
    if (invoices.length === 0) return [];
    const clientIds = Array.from(new Set(invoices.map((i) => i.clientId)));
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
    return invoices.map((i) => {
      const row = fromMongoDoc(i) as Invoice;
      const client = clientMap.get(i.clientId) ?? { id: i.clientId, name: "Unknown" };
      return { ...row, client };
    });
  } catch {
    return [];
  }
}

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([
    getInvoices(),
    getActiveClientsForSelect(),
  ]);
  const mrr = invoices
    .filter((i) => i.type === "Retainer")
    .reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "Pending" || i.status === "RefundRequested")
    .reduce((sum, i) => sum + i.amount, 0);
  const extraWorkRevenue = invoices
    .filter((i) => i.type === "AdHoc")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Financials</h1>
      <FinancialsView
        initialInvoices={invoices}
        clients={clients}
        metrics={{ mrr, outstanding, extraWorkRevenue }}
      />
    </div>
  );
}
