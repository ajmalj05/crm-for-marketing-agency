"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toObjectId } from "@/lib/types";
import type { VendorWorkStatus } from "@/lib/types";

export type CreateVendorWorkInput = {
  clientId: string;
  vendorId: string | null;
  vendorName: string;
  taskDescription: string;
  projectName?: string | null;
  cost: number;
  currency?: string;
  amountChargedToClient?: number | null;
  advanceAmount?: number;
  advancePaidAt?: Date | null;
  status?: VendorWorkStatus;
};

export async function createVendorWork(input: CreateVendorWorkInput) {
  const taskDescription = input.taskDescription?.trim();
  const vendorName = input.vendorName?.trim();
  const resolvedName =
    input.vendorId && input.vendorName
      ? input.vendorName
      : vendorName || "";
  if (!input.clientId || !resolvedName || !taskDescription || input.cost == null) {
    return { success: false as const, error: "Client, vendor, task, and cost are required." };
  }
  const cost = Number(input.cost);
  if (isNaN(cost) || cost < 0) {
    return { success: false as const, error: "Cost must be a non-negative number." };
  }
  const advanceAmount = Number(input.advanceAmount ?? 0);
  if (isNaN(advanceAmount) || advanceAmount < 0) {
    return { success: false as const, error: "Advance amount must be a non-negative number." };
  }
  if (advanceAmount > cost) {
    return { success: false as const, error: "Advance amount cannot exceed cost." };
  }
  try {
    const db = await getDb();
    await db.collection("VendorWork").insertOne({
      clientId: input.clientId,
      vendorId: input.vendorId ?? null,
      vendorName: resolvedName,
      taskDescription,
      projectName: input.projectName?.trim() || null,
      cost,
      currency: input.currency?.trim() || "INR",
      amountChargedToClient: input.amountChargedToClient ?? null,
      advanceAmount,
      advancePaidAt: input.advancePaidAt ?? null,
      status: input.status ?? "Not Started",
      createdAt: new Date(),
    });
    revalidatePath("/vendors");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createVendorWork error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create vendor work",
    };
  }
}

export type UpdateVendorWorkInput = {
  status?: VendorWorkStatus;
  advanceAmount?: number;
  advancePaidAt?: Date | null;
};

export async function updateVendorWork(id: string, input: UpdateVendorWorkInput) {
  if (!id) return { success: false as const, error: "ID is required." };
  try {
    const db = await getDb();
    const updateFields: Record<string, unknown> = {};
    if (input.status != null) updateFields.status = input.status;
    if (input.advanceAmount != null) {
      if (input.advanceAmount < 0) return { success: false as const, error: "Advance amount must be non-negative." };
      updateFields.advanceAmount = input.advanceAmount;
    }
    if (input.advancePaidAt !== undefined) updateFields.advancePaidAt = input.advancePaidAt;
    if (Object.keys(updateFields).length === 0) return { success: true as const, error: null };
    const result = await db
      .collection("VendorWork")
      .updateOne({ _id: toObjectId(id) }, { $set: updateFields });
    if (result.matchedCount === 0) return { success: false as const, error: "Vendor work not found." };
    revalidatePath("/vendors");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("updateVendorWork error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to update vendor work",
    };
  }
}

export type CreateVendorInput = {
  name: string;
  contact?: string | null;
  email?: string | null;
  notes?: string | null;
};

export async function createVendor(input: CreateVendorInput) {
  const name = input.name?.trim();
  if (!name) return { success: false as const, error: "Vendor name is required." };
  try {
    const db = await getDb();
    await db.collection("Vendor").insertOne({
      name,
      contact: input.contact?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date(),
    });
    revalidatePath("/vendors");
    revalidatePath("/vendors/manage");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createVendor error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create vendor",
    };
  }
}

export type UpdateVendorInput = {
  name?: string;
  contact?: string | null;
  email?: string | null;
  notes?: string | null;
};

export async function updateVendor(id: string, input: UpdateVendorInput) {
  if (!id) return { success: false as const, error: "ID is required." };
  const name = input.name?.trim();
  if (input.name != null && !name) return { success: false as const, error: "Vendor name cannot be empty." };
  try {
    const db = await getDb();
    const updateFields: Record<string, unknown> = {};
    if (input.name != null) updateFields.name = name;
    if (input.contact !== undefined) updateFields.contact = input.contact?.trim() || null;
    if (input.email !== undefined) updateFields.email = input.email?.trim() || null;
    if (input.notes !== undefined) updateFields.notes = input.notes?.trim() || null;
    if (Object.keys(updateFields).length === 0) return { success: true as const, error: null };
    const result = await db
      .collection("Vendor")
      .updateOne({ _id: toObjectId(id) }, { $set: updateFields });
    if (result.matchedCount === 0) return { success: false as const, error: "Vendor not found." };
    revalidatePath("/vendors");
    revalidatePath("/vendors/manage");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("updateVendor error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to update vendor",
    };
  }
}

export async function deleteVendor(id: string) {
  if (!id) return { success: false as const, error: "ID is required." };
  try {
    const db = await getDb();
    const result = await db.collection("Vendor").deleteOne({ _id: toObjectId(id) });
    if (result.deletedCount === 0) return { success: false as const, error: "Vendor not found." };
    revalidatePath("/vendors");
    revalidatePath("/vendors/manage");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("deleteVendor error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to delete vendor",
    };
  }
}
