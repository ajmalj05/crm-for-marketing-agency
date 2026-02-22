/**
 * ARM domain types and enums (replaces @prisma/client for app-facing types).
 * MongoDB stores _id (ObjectId); app-facing types use id: string.
 */

import { ObjectId } from "mongodb";

// ---------------------------------------------------------------------------
// Enums (string literals matching Prisma schema)
// ---------------------------------------------------------------------------

export type ContentPlatform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "TikTok"
  | "YouTube";

export type ContentType = "Video" | "Poster" | "Image";

export type ContentTaskStatus =
  | "Ideation"
  | "Shooted"
  | "Editing"
  | "Scheduled"
  | "Posted";

export type InvoiceStatus = "Paid" | "Pending" | "RefundRequested";

export type InvoiceType = "Retainer" | "AdHoc";

export type VendorWorkStatus =
  | "Not Started"
  | "Advance Paid"
  | "In Progress"
  | "Completed"
  | "Paid"
  | "Unpaid"; // legacy

export type ITPlatformType = "Domain" | "Hosting";

// ---------------------------------------------------------------------------
// App-facing types (id: string; used by components and pages)
// ---------------------------------------------------------------------------

export type Client = {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
};

export type ClientOption = { id: string; name: string };

export type ContentTask = {
  id: string;
  clientId: string;
  client: ClientOption;
  title: string;
  platform: ContentPlatform;
  contentType: ContentType;
  publishDate: Date;
  status: ContentTaskStatus;
  isInternalAgencyPost: boolean;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
};

export type Invoice = {
  id: string;
  clientId: string;
  client: ClientOption;
  amount: number;
  currency: string;
  dueDate: Date;
  status: InvoiceStatus;
  type: InvoiceType;
  description: string | null;
  createdAt: Date;
};

export type Vendor = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
};

export type VendorOption = { id: string; name: string };

export type VendorWork = {
  id: string;
  vendorId: string | null;
  vendorName: string;
  clientId: string;
  client: ClientOption;
  taskDescription: string;
  projectName: string | null;
  cost: number;
  currency: string;
  amountChargedToClient: number | null;
  advanceAmount: number;
  advancePaidAt: Date | null;
  status: VendorWorkStatus;
  createdAt: Date;
};

export type AdAccount = {
  id: string;
  clientId: string;
  client: ClientOption;
  platformName: string;
  accountId: string;
  campaignId: string | null;
  maxDailyBudget: number;
  currentBalance: number;
  currency: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
};

export type ITCredential = {
  id: string;
  clientId: string;
  client: ClientOption;
  platformType: ITPlatformType;
  providerName: string;
  renewalDate: Date;
  notificationEmail: string;
  loginEmail: string | null;
  passwordEncrypted: string | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Mongo document types (have _id: ObjectId; used in db layer)
// ---------------------------------------------------------------------------

export type ClientDoc = Omit<Client, "id"> & { _id: ObjectId };

export type ContentTaskDoc = Omit<ContentTask, "id" | "client"> & { _id: ObjectId };

export type InvoiceDoc = Omit<Invoice, "id" | "client"> & { _id: ObjectId };

export type VendorDoc = Omit<Vendor, "id"> & { _id: ObjectId };

export type VendorWorkDoc = Omit<VendorWork, "id" | "client"> & { _id: ObjectId };

export type AdAccountDoc = Omit<AdAccount, "id" | "client"> & { _id: ObjectId };

export type ITCredentialDoc = Omit<ITCredential, "id" | "client"> & { _id: ObjectId };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

/** Map Mongo doc (with _id) to app shape (id: string, no _id). */
export function fromMongoDoc<T extends { _id: ObjectId }>(
  doc: T
): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Omit<T, "_id"> & { id: string };
}
