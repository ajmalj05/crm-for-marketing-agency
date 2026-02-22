import type { ContentPlatform, ContentType, ContentTaskStatus } from "@/lib/types";

export type ContentTaskWithClient = {
  id: string;
  clientId: string;
  title: string;
  platform: ContentPlatform;
  contentType: ContentType;
  publishDate: Date;
  status: ContentTaskStatus;
  isInternalAgencyPost: boolean;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  client: { id: string; name: string };
};

export type ClientOption = { id: string; name: string };

export const MOCK_CLIENTS: ClientOption[] = [
  { id: "client-1", name: "Acme Corp" },
  { id: "client-2", name: "Beta Brand" },
  { id: "client-3", name: "Gamma Studio" },
];

export const MOCK_TASKS: ContentTaskWithClient[] = [
  {
    id: "task-1",
    clientId: "client-1",
    title: "Q1 Campaign Reel",
    platform: "Instagram",
    contentType: "Video",
    publishDate: new Date("2025-03-01"),
    status: "Ideation",
    isInternalAgencyPost: false,
    customFields: null,
    createdAt: new Date("2025-02-01"),
    client: { id: "client-1", name: "Acme Corp" },
  },
  {
    id: "task-2",
    clientId: "client-1",
    title: "Product Launch Poster",
    platform: "LinkedIn",
    contentType: "Poster",
    publishDate: new Date("2025-03-15"),
    status: "Shooted",
    isInternalAgencyPost: false,
    customFields: null,
    createdAt: new Date("2025-02-05"),
    client: { id: "client-1", name: "Acme Corp" },
  },
  {
    id: "task-3",
    clientId: "client-2",
    title: "TikTok Short",
    platform: "TikTok",
    contentType: "Video",
    publishDate: new Date("2025-03-20"),
    status: "Scheduled",
    isInternalAgencyPost: false,
    customFields: null,
    createdAt: new Date("2025-02-10"),
    client: { id: "client-2", name: "Beta Brand" },
  },
  {
    id: "task-4",
    clientId: "client-2",
    title: "Agency Culture Post",
    platform: "Instagram",
    contentType: "Image",
    publishDate: new Date("2025-02-18"),
    status: "Posted",
    isInternalAgencyPost: true,
    customFields: null,
    createdAt: new Date("2025-02-12"),
    client: { id: "client-2", name: "Beta Brand" },
  },
];
