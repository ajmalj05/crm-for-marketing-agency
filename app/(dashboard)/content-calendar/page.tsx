import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getActiveClientsForSelect } from "@/lib/clients";
import { fromMongoDoc } from "@/lib/types";
import type { ClientOption } from "@/lib/types";
import { ContentCalendarView } from "@/components/content-calendar-view";
import { MOCK_TASKS, MOCK_CLIENTS, type ContentTaskWithClient } from "./mock-tasks";

async function getTasks(): Promise<ContentTaskWithClient[]> {
  try {
    const db = await getDb();
    const tasks = await db
      .collection("ContentTask")
      .find({})
      .sort({ publishDate: 1 })
      .toArray();
    if (tasks.length === 0) return MOCK_TASKS;
    const clientIds = Array.from(new Set(tasks.map((t) => t.clientId)));
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
    return tasks.map((t) => {
      const client = clientMap.get(t.clientId) ?? { id: t.clientId, name: "Unknown" };
      return { ...fromMongoDoc(t), client } as ContentTaskWithClient;
    });
  } catch {
    return MOCK_TASKS;
  }
}

export default async function ContentCalendarPage() {
  const [tasks, clients] = await Promise.all([
    getTasks(),
    getActiveClientsForSelect().then((c) => (c.length ? c : MOCK_CLIENTS)),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Content & Production Calendar</h1>
      <ContentCalendarView initialTasks={tasks} clients={clients} />
    </div>
  );
}
