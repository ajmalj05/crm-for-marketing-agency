import { getDb } from "@/lib/db";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption } from "@/lib/types";

/**
 * Clients suitable for dropdowns/selects across the app (Production Hub, Financials, etc.).
 * Returns only active clients, ordered by name.
 */
export async function getActiveClientsForSelect(): Promise<ClientOption[]> {
  try {
    const db = await getDb();
    const cursor = db
      .collection("Client")
      .find({ active: true })
      .sort({ name: 1 });
    const docs = await cursor.toArray();
    return docs.map((d) => {
      const { id, name } = fromMongoDoc(d);
      return { id, name };
    });
  } catch {
    return [];
  }
}
