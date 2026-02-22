import { getDb } from "@/lib/db";
import { fromMongoDoc } from "@/lib/types";
import type { Vendor } from "@/lib/types";
import { ManageVendorsView } from "@/components/manage-vendors-view";

async function getVendors(): Promise<Vendor[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection("Vendor")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return docs.map((d) => fromMongoDoc(d) as Vendor);
  } catch {
    return [];
  }
}

export default async function ManageVendorsPage() {
  const vendors = await getVendors();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Vendors</h1>
      <ManageVendorsView vendors={vendors} />
    </div>
  );
}
