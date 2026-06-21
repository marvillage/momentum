import { prisma } from "./db";

// Jira integration for AECAD. Live mode uses the Jira REST API (JIRA_EMAIL +
// JIRA_API_TOKEN); when that's unavailable (org blocks API tokens), it falls
// back to a stored snapshot. Days-left is always computed live from the end date.

const BASE = process.env.JIRA_BASE_URL || "https://aecad.atlassian.net";
const BOARD = process.env.JIRA_BOARD_ID || "2";

export function jiraEnabled(): boolean {
  return !!(process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN);
}

export type SprintIssue = {
  key: string;
  summary: string;
  type: string;
  status: string;
  category: "new" | "indeterminate" | "done" | "cancelled" | string;
  points: number | null;
  url: string;
};

type Stored = {
  sprint: { name: string; startDate: string | null; endDate: string | null; goal?: string | null };
  issues: SprintIssue[];
};

export type SprintView = {
  sprint: { name: string; startDate: string | null; endDate: string | null; daysLeft: number | null; lengthDays: number | null };
  totals: {
    count: number;
    doneCount: number;
    inProgressCount: number;
    todoCount: number;
    pointsTracked: boolean;
    totalSP: number;
    doneSP: number;
  };
  issues: SprintIssue[];
};

export type SprintData =
  | { status: "unconfigured" }
  | { status: "error"; error: string }
  | { status: "no_sprint" }
  | { status: "ok"; source: "live" | "snapshot"; syncedAt: string | null; view: SprintView };

function authHeader(): string {
  return "Basic " + Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64");
}
async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: authHeader(), Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Jira ${res.status} on ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

function dayDiff(to: string | null): number | null {
  if (!to) return null;
  return Math.max(0, Math.ceil((new Date(to).getTime() - Date.now()) / 86400000));
}
function spanDays(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

// Build the render view from a stored/computed snapshot.
function toView(s: Stored): SprintView {
  const issues = s.issues;
  const active = issues.filter((i) => i.category !== "cancelled");
  const pointsTracked = issues.some((i) => typeof i.points === "number");
  const sum = (arr: SprintIssue[]) => arr.reduce((n, i) => n + (i.points || 0), 0);
  return {
    sprint: {
      name: s.sprint.name,
      startDate: s.sprint.startDate,
      endDate: s.sprint.endDate,
      daysLeft: dayDiff(s.sprint.endDate),
      lengthDays: spanDays(s.sprint.startDate, s.sprint.endDate),
    },
    totals: {
      count: active.length,
      doneCount: active.filter((i) => i.category === "done").length,
      inProgressCount: active.filter((i) => i.category === "indeterminate").length,
      todoCount: active.filter((i) => i.category === "new").length,
      pointsTracked,
      totalSP: sum(active),
      doneSP: sum(active.filter((i) => i.category === "done")),
    },
    issues,
  };
}

function normCategory(statusName: string, catKey: string): SprintIssue["category"] {
  if (/cancel/i.test(statusName)) return "cancelled";
  return (catKey as SprintIssue["category"]) || "new";
}

export async function getSprintData(userId: string): Promise<SprintData> {
  if (jiraEnabled()) {
    try {
      const fields = await jget<{ id: string; name: string }[]>("/rest/api/3/field");
      const spId = (fields.find((f) => /^story point estimate$/i.test(f.name)) || fields.find((f) => /story point/i.test(f.name)))?.id;
      const sprints = await jget<{ values: { id: number; name: string; goal?: string; startDate?: string; endDate?: string }[] }>(
        `/rest/agile/1.0/board/${BOARD}/sprint?state=active`
      );
      const sprint = sprints.values?.[0];
      if (!sprint) return { status: "no_sprint" };
      const fieldsParam = ["summary", "status", "issuetype", spId].filter(Boolean).join(",");
      const jql = encodeURIComponent("assignee = currentUser() ORDER BY status ASC");
      const data = await jget<{ issues: { key: string; fields: Record<string, unknown> }[] }>(
        `/rest/agile/1.0/sprint/${sprint.id}/issue?jql=${jql}&fields=${fieldsParam}&maxResults=100`
      );
      const issues: SprintIssue[] = (data.issues || []).map((i) => {
        const f = i.fields as { summary: string; issuetype?: { name: string }; status?: { name: string; statusCategory?: { key: string } } } & Record<string, unknown>;
        return {
          key: i.key,
          summary: f.summary,
          type: f.issuetype?.name ?? "Issue",
          status: f.status?.name ?? "Unknown",
          category: normCategory(f.status?.name ?? "", f.status?.statusCategory?.key ?? "new"),
          points: spId ? ((f[spId] as number | null) ?? null) : null,
          url: `${BASE}/browse/${i.key}`,
        };
      });
      return {
        status: "ok",
        source: "live",
        syncedAt: null,
        view: toView({ sprint: { name: sprint.name, startDate: sprint.startDate ?? null, endDate: sprint.endDate ?? null, goal: sprint.goal ?? null }, issues }),
      };
    } catch (e) {
      return { status: "error", error: (e as Error).message };
    }
  }

  // Snapshot fallback.
  const snap = await prisma.jiraSnapshot.findUnique({ where: { userId } });
  if (!snap) return { status: "unconfigured" };
  try {
    const stored = JSON.parse(snap.data) as Stored;
    return { status: "ok", source: "snapshot", syncedAt: snap.syncedAt.toISOString(), view: toView(stored) };
  } catch {
    return { status: "error", error: "Stored snapshot is corrupt." };
  }
}
