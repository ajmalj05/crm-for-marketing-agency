"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar as CalendarIcon, LayoutGrid } from "lucide-react";
import type { ContentPlatform, ContentType, ContentTaskStatus } from "@/lib/types";
import type { ContentTaskWithClient } from "@/app/(dashboard)/content-calendar/mock-tasks";
import { createContentTask, updateContentTask } from "@/app/(dashboard)/content-calendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUSES: ContentTaskStatus[] = ["Ideation", "Shooted", "Editing", "Scheduled", "Posted"];
const PLATFORMS: ContentPlatform[] = ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube"];
const CONTENT_TYPES: ContentType[] = ["Video", "Poster", "Image"];

type Props = {
  initialTasks: ContentTaskWithClient[];
  clients: { id: string; name: string }[];
};

function getCustomFields(task: ContentTaskWithClient): Record<string, string> {
  const raw = task.customFields;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v == null ? "" : String(v);
  }
  return out;
}

function TaskCard({
  task,
  onClick,
}: {
  task: ContentTaskWithClient;
  onClick: () => void;
}) {
  const publishStr =
    task.publishDate instanceof Date
      ? task.publishDate.toLocaleDateString()
      : new Date(task.publishDate).toLocaleDateString();
  return (
    <Card
      className="cursor-pointer bg-card transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <p className="text-sm font-medium leading-none">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.client.name}</p>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        <span>{task.platform}</span>
        <span className="mx-1">·</span>
        <span>{task.contentType}</span>
        <span className="mx-1">·</span>
        <span>{publishStr}</span>
        {task.isInternalAgencyPost && (
          <span className="ml-1 rounded bg-secondary px-1 py-0.5 text-[10px]">Internal</span>
        )}
      </CardContent>
    </Card>
  );
}

function TaskDetailSheet({
  task,
  clients,
  open,
  onOpenChange,
  onSaved,
}: {
  task: ContentTaskWithClient | null;
  clients: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState<ContentPlatform | "">("");
  const [contentType, setContentType] = React.useState<ContentType | "">("");
  const [publishDate, setPublishDate] = React.useState("");
  const [status, setStatus] = React.useState<ContentTaskStatus | "">("");
  const [isInternalAgencyPost, setIsInternalAgencyPost] = React.useState(false);
  const [customFields, setCustomFields] = React.useState<Record<string, string>>({});
  const [newCustomKey, setNewCustomKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setPlatform(task.platform);
    setContentType(task.contentType);
    setPublishDate(
      task.publishDate instanceof Date
        ? task.publishDate.toISOString().slice(0, 10)
        : new Date(task.publishDate).toISOString().slice(0, 10)
    );
    setStatus(task.status);
    setIsInternalAgencyPost(task.isInternalAgencyPost);
    setCustomFields(getCustomFields(task));
    setNewCustomKey("");
    setError(null);
  }, [task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setError(null);
    setIsPending(true);
    const customObj = Object.fromEntries(
      Object.entries(customFields).filter(([, v]) => v.trim() !== "")
    );
    const result = await updateContentTask(task.id, {
      title: title.trim(),
      platform: platform as ContentPlatform,
      contentType: contentType as ContentType,
      publishDate,
      status: status as ContentTaskStatus,
      isInternalAgencyPost,
      customFields: Object.keys(customObj).length ? customObj : null,
    });
    setIsPending(false);
    if (result.success) {
      onSaved();
      router.refresh();
      onOpenChange(false);
    } else {
      setError(result.error ?? "Failed to update");
    }
  };

  const addCustomField = () => {
    const key = newCustomKey.trim().replace(/\s+/g, " ");
    if (!key) return;
    setCustomFields((prev) => ({ ...prev, [key]: "" }));
    setNewCustomKey("");
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit task</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="detail-title">Title</Label>
            <Input
              id="detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="detail-publishDate">Publish date</Label>
            <Input
              id="detail-publishDate"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ContentPlatform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Content type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentTaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="detail-internal"
              checked={isInternalAgencyPost}
              onChange={(e) => setIsInternalAgencyPost(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="detail-internal">Internal agency post</Label>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block">Custom fields</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              Add any key (e.g. Approval Link, Client Feedback). Values are saved with the task.
            </p>
            {Object.entries(customFields).map(([key, value]) => (
              <div key={key} className="mb-2 flex gap-2">
                <Input
                  className="flex-1 font-mono text-sm"
                  value={value}
                  onChange={(e) =>
                    setCustomFields((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={key}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCustomFields((prev) => {
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Field name (e.g. Approval Link)"
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomField())}
              />
              <Button type="button" variant="secondary" onClick={addCustomField}>
                Add field
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AddTaskForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState<ContentPlatform | "">("");
  const [contentType, setContentType] = React.useState<ContentType | "">("");
  const [publishDate, setPublishDate] = React.useState("");
  const [status, setStatus] = React.useState<ContentTaskStatus | "">("");
  const [isInternalAgencyPost, setIsInternalAgencyPost] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clientId || !title || !platform || !contentType || !publishDate || !status) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await createContentTask({
      clientId,
      title,
      platform,
      contentType,
      publishDate,
      status,
      isInternalAgencyPost,
    });
    setIsPending(false);
    if (result.success) {
      setOpen(false);
      setClientId("");
      setTitle("");
      setPlatform("");
      setContentType("");
      setPublishDate("");
      setStatus("");
      setIsInternalAgencyPost(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add content task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" required value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                name="platform"
                required
                value={platform}
                onValueChange={(v) => setPlatform(v as ContentPlatform)}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contentType">Content type</Label>
              <Select
                name="contentType"
                required
                value={contentType}
                onValueChange={(v) => setContentType(v as ContentType)}
              >
                <SelectTrigger id="contentType">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="publishDate">Publish date</Label>
            <Input
              id="publishDate"
              name="publishDate"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              required
              value={status}
              onValueChange={(v) => setStatus(v as ContentTaskStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isInternalAgencyPost"
              checked={isInternalAgencyPost}
              onChange={(e) => setIsInternalAgencyPost(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isInternalAgencyPost">Internal agency post</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type MonthState = { year: number; month: number };

function CalendarGridView({
  month,
  onPrevMonth,
  onNextMonth,
  tasks,
  onTaskClick,
}: {
  month: MonthState;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  tasks: ContentTaskWithClient[];
  onTaskClick: (task: ContentTaskWithClient) => void;
}) {
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDay = new Date(month.year, month.month, 1).getDay();
  const tasksByDay = React.useMemo(() => {
    const map: Record<number, ContentTaskWithClient[]> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = [];
    for (const task of tasks) {
      const d = task.publishDate instanceof Date ? task.publishDate : new Date(task.publishDate);
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(task);
    }
    return map;
  }, [tasks, daysInMonth]);

  const monthLabel = new Date(month.year, month.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPrevMonth}>
          Previous
        </Button>
        <span className="font-medium">{monthLabel}</span>
        <Button variant="outline" size="sm" onClick={onNextMonth}>
          Next
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`pad-${i}`} className="min-h-[80px] rounded border border-border/50 bg-muted/20 p-1" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayTasks = tasksByDay[day] ?? [];
          return (
            <div
              key={day}
              className="min-h-[80px] rounded border border-border bg-card p-1 text-left"
            >
              <span className="text-foreground">{day}</span>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] hover:bg-primary/20"
                    onClick={() => onTaskClick(t)}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContentCalendarView({ initialTasks, clients }: Props) {
  const [viewMode, setViewMode] = React.useState<"calendar" | "kanban">("kanban");
  const [clientFilter, setClientFilter] = React.useState<string>("all");
  const [selectedTask, setSelectedTask] = React.useState<ContentTaskWithClient | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [month, setMonth] = React.useState<MonthState>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const goPrevMonth = () =>
    setMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }));
  const goNextMonth = () =>
    setMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }));

  const clientFilteredTasks = React.useMemo(() => {
    let list = initialTasks;
    if (clientFilter === "internal") {
      list = list.filter((t) => t.isInternalAgencyPost);
    } else if (clientFilter && clientFilter !== "all") {
      list = list.filter((t) => t.clientId === clientFilter);
    }
    return list;
  }, [initialTasks, clientFilter]);

  const filteredTasks = React.useMemo(() => {
    return clientFilteredTasks.filter((task) => {
      const d = task.publishDate instanceof Date ? task.publishDate : new Date(task.publishDate);
      return d.getFullYear() === month.year && d.getMonth() === month.month;
    });
  }, [clientFilteredTasks, month.year, month.month]);

  const tasksByStatus = React.useMemo(() => {
    const map: Partial<Record<ContentTaskStatus, ContentTaskWithClient[]>> = {};
    for (const s of STATUSES) map[s] = [];
    for (const task of filteredTasks) {
      if (task.status in map) {
        (map[task.status] as ContentTaskWithClient[]).push(task);
      }
    }
    return map;
  }, [filteredTasks]);

  const openTask = (task: ContentTaskWithClient) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const monthLabel = new Date(month.year, month.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" onClick={goPrevMonth}>
          Previous
        </Button>
        <span className="min-w-[140px] text-center font-medium">{monthLabel}</span>
        <Button variant="outline" size="sm" onClick={goNextMonth}>
          Next
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="mr-1.5 h-4 w-4" />
              Calendar Grid
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Kanban Board
            </Button>
          </div>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              <SelectItem value="internal">Internal agency posts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddTaskForm clients={clients} />
      </div>

      {viewMode === "calendar" && (
        <CalendarGridView
          month={month}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          tasks={filteredTasks}
          onTaskClick={openTask}
        />
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATUSES.map((status) => (
            <div
              key={status}
              className={cn(
                "rounded-lg border border-border bg-muted/30 p-3",
                "flex flex-col gap-2"
              )}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {status}
              </h2>
              <div className="flex flex-col gap-2">
                {(tasksByStatus[status] ?? []).map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => openTask(task)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDetailSheet
        task={selectedTask}
        clients={clients}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedTask(null);
        }}
        onSaved={() => {}}
      />
    </div>
  );
}
