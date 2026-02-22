"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { toObjectId } from "@/lib/types";
import type { ContentPlatform, ContentType, ContentTaskStatus } from "@/lib/types";

export type CreateContentTaskInput = {
  clientId: string;
  title: string;
  platform: ContentPlatform;
  contentType: ContentType;
  publishDate: string;
  status: ContentTaskStatus;
  isInternalAgencyPost: boolean;
};

export async function createContentTask(input: CreateContentTaskInput) {
  try {
    const db = await getDb();
    await db.collection("ContentTask").insertOne({
      clientId: input.clientId,
      title: input.title.trim(),
      platform: input.platform,
      contentType: input.contentType,
      publishDate: new Date(input.publishDate),
      status: input.status,
      isInternalAgencyPost: input.isInternalAgencyPost,
      createdAt: new Date(),
    });
    revalidatePath("/content-calendar");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("createContentTask error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create task",
    };
  }
}

export type UpdateContentTaskInput = {
  title?: string;
  platform?: ContentPlatform;
  contentType?: ContentType;
  publishDate?: string;
  status?: ContentTaskStatus;
  isInternalAgencyPost?: boolean;
  customFields?: Record<string, unknown> | null;
};

export async function updateContentTask(taskId: string, input: UpdateContentTaskInput) {
  try {
    const $set: Record<string, unknown> = {};
    if (input.title !== undefined) $set.title = input.title.trim();
    if (input.platform !== undefined) $set.platform = input.platform;
    if (input.contentType !== undefined) $set.contentType = input.contentType;
    if (input.publishDate !== undefined) $set.publishDate = new Date(input.publishDate);
    if (input.status !== undefined) $set.status = input.status;
    if (input.isInternalAgencyPost !== undefined) $set.isInternalAgencyPost = input.isInternalAgencyPost;
    if (input.customFields !== undefined) $set.customFields = input.customFields;
    if (Object.keys($set).length === 0) {
      return { success: true as const, error: null };
    }
    const db = await getDb();
    await db.collection("ContentTask").updateOne({ _id: toObjectId(taskId) }, { $set });
    revalidatePath("/content-calendar");
    return { success: true as const, error: null };
  } catch (e) {
    console.error("updateContentTask error:", e);
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to update task",
    };
  }
}
