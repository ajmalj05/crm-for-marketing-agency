"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toObjectId } from "@/lib/types";

export type CreateClientInput = {
  name: string;
};

export async function createClient(input: CreateClientInput) {
  const name = input.name?.trim();
  if (!name) {
    return { success: false as const, error: "Name is required" };
  }
  try {
    const db = await getDb();
    await db.collection("Client").insertOne({
      name,
      active: true,
      createdAt: new Date(),
    });
    revalidatePath("/clients");
    revalidatePath("/content-calendar");
    revalidatePath("/invoices");
    revalidatePath("/vendors");
    revalidatePath("/ad-accounts");
    revalidatePath("/it-credentials");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createClient error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create client",
    };
  }
}

export type UpdateClientInput = {
  id: string;
  name?: string;
  active?: boolean;
};

export async function updateClient(input: UpdateClientInput) {
  const { id, name, active } = input;
  if (!id) {
    return { success: false as const, error: "Client ID is required" };
  }
  try {
    const $set: { name?: string; active?: boolean } = {};
    if (name !== undefined) $set.name = name.trim();
    if (active !== undefined) $set.active = active;
    if (Object.keys($set).length === 0) {
      return { success: true as const, error: null };
    }
    const db = await getDb();
    await db.collection("Client").updateOne({ _id: toObjectId(id) }, { $set });
    revalidatePath("/clients");
    revalidatePath("/content-calendar");
    revalidatePath("/invoices");
    revalidatePath("/vendors");
    revalidatePath("/ad-accounts");
    revalidatePath("/it-credentials");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("updateClient error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to update client",
    };
  }
}
