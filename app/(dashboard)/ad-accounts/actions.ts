"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toObjectId } from "@/lib/types";

export type CreateAdAccountInput = {
  clientId: string;
  platformName: string;
  accountId: string;
  campaignId?: string | null;
  maxDailyBudget: number;
  currentBalance: number;
  currency?: string | null;
};

export async function createAdAccount(input: CreateAdAccountInput) {
  const platformName = input.platformName?.trim();
  const accountId = input.accountId?.trim();
  if (!input.clientId || !platformName || !accountId) {
    return { success: false as const, error: "Client, platform name, and account ID are required." };
  }
  const maxDailyBudget = Number(input.maxDailyBudget);
  const currentBalance = Number(input.currentBalance);
  if (isNaN(maxDailyBudget) || maxDailyBudget < 0 || isNaN(currentBalance) || currentBalance < 0) {
    return { success: false as const, error: "Max daily budget and current balance must be non-negative." };
  }
  try {
    const db = await getDb();
    await db.collection("AdAccount").insertOne({
      clientId: input.clientId,
      platformName,
      accountId,
      campaignId: input.campaignId?.trim() || null,
      maxDailyBudget,
      currentBalance,
      currency: input.currency?.trim() || "USD",
      customFields: null,
      createdAt: new Date(),
    });
    revalidatePath("/ad-accounts");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createAdAccount error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create ad account",
    };
  }
}

export async function updateAdAccountCustomFields(
  accountId: string,
  customFields: Record<string, unknown> | null
) {
  try {
    const db = await getDb();
    await db.collection("AdAccount").updateOne(
      { _id: toObjectId(accountId) },
      { $set: { customFields } }
    );
    revalidatePath("/ad-accounts");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("updateAdAccountCustomFields error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to update",
    };
  }
}
