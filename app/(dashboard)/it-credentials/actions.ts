"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toObjectId } from "@/lib/types";
import type { ITPlatformType } from "@/lib/types";
import { decryptPassword, encryptPassword } from "@/lib/vault-crypto";

export type CreateITCredentialInput = {
  clientId: string;
  platformType: ITPlatformType;
  providerName: string;
  renewalDate: string;
  notificationEmail: string;
  loginEmail?: string | null;
  password?: string | null;
};

export async function createITCredential(input: CreateITCredentialInput) {
  const providerName = input.providerName?.trim();
  const notificationEmail = input.notificationEmail?.trim();
  if (!input.clientId || !providerName || !notificationEmail) {
    return { success: false as const, error: "Client, provider name, and notification email are required." };
  }
  const renewalDate = new Date(input.renewalDate);
  if (isNaN(renewalDate.getTime())) {
    return { success: false as const, error: "Invalid renewal date." };
  }
  try {
    const db = await getDb();
    const passwordEncrypted = input.password?.trim()
      ? encryptPassword(input.password.trim())
      : null;
    await db.collection("ITCredential").insertOne({
      clientId: input.clientId,
      platformType: input.platformType,
      providerName,
      renewalDate,
      notificationEmail,
      loginEmail: input.loginEmail?.trim() || null,
      passwordEncrypted,
      createdAt: new Date(),
    });
    revalidatePath("/it-credentials");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createITCredential error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create credential",
    };
  }
}

export async function revealPassword(
  credentialId: string
): Promise<{ value: string | null; error: string | null }> {
  try {
    const db = await getDb();
    const cred = await db.collection("ITCredential").findOne(
      { _id: toObjectId(credentialId) },
      { projection: { passwordEncrypted: 1 } }
    );
    if (!cred?.passwordEncrypted) return { value: null, error: null };
    const decrypted = decryptPassword(cred.passwordEncrypted);
    return { value: decrypted, error: null };
  } catch (e) {
    console.error("revealPassword error:", e);
    return { value: null, error: e instanceof Error ? e.message : "Failed to reveal" };
  }
}
