"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export type CreateInvoiceInput = {
  clientId: string;
  amount: number;
  currency: string;
  dueDate: string;
  description?: string | null;
};

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const db = await getDb();
    await db.collection("Invoice").insertOne({
      clientId: input.clientId,
      amount: input.amount,
      currency: (input.currency ?? "").trim() || "USD",
      dueDate: new Date(input.dueDate),
      type: "AdHoc",
      status: "Pending",
      description: input.description?.trim() || null,
      createdAt: new Date(),
    });
    revalidatePath("/invoices");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createInvoice error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create invoice",
    };
  }
}
