// Jira Cloud integration for the AECAD module — active sprint, your assigned
// issues, story points, and days left. Auth via JIRA_EMAIL + JIRA_API_TOKEN
// (Basic auth). Board + base URL default to the AECAD project.

const BASE = process.env.JIRA_BASE_URL || "https://aecad.atlassian.net";
const BOARD = process.env.JIRA_BOARD_ID || "2";

export function jiraEnabled(): boolean {
  return !!(process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN);
}

function authHeader(): string {
  const token = `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`;
  return "Basic " + Buffer.from(token).toString("base64");
}

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jira ${res.status} on ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

export type SprintIssue = {
  key: string;
  summary: string;
  status: string;
  category: "new" | "indeterminate" | "done" | string; // statusCategory.key
  points: number | null;
  url: string;
};

export type SprintData =
  | { status: "unconfigured" }
  | { status: "error"; error: string }
  | { status: "no_sprint" }
  | {
      status: "ok";
      sprint: { name: string; goal: string | null; startDate: string | null; endDate: string | null; daysLeft: number | null };
      totals: { totalSP: number; doneSP: number; inProgressSP: number; count: number; doneCount: number };
      issues: SprintIssue[];
    };

export async function getSprintData(): Promise<SprintData> {
  if (!jiraEnabled()) return { status: "unconfigured" };
  try {
    // 1. Find the Story Points field id (varies per Jira site).
    const fields = await jget<{ id: string; name: string }[]>("/rest/api/3/field");
    const spField =
      fields.find((f) => /^story point estimate$/i.test(f.name)) ||
      fields.find((f) => /^story points?$/i.test(f.name)) ||
      fields.find((f) => /story point/i.test(f.name));
    const spId = spField?.id;

    // 2. Active sprint on the board.
    const sprints = await jget<{ values: { id: number; name: string; goal?: string; startDate?: string; endDate?: string }[] }>(
      `/rest/agile/1.0/board/${BOARD}/sprint?state=active`
    );
    const sprint = sprints.values?.[0];
    if (!sprint) return { status: "no_sprint" };

    // 3. Your issues in that sprint.
    const fieldsParam = ["summary", "status", spId].filter(Boolean).join(",");
    const jql = encodeURIComponent("assignee = currentUser() ORDER BY status ASC");
    const data = await jget<{ issues: { key: string; fields: Record<string, unknown> }[] }>(
      `/rest/agile/1.0/sprint/${sprint.id}/issue?jql=${jql}&fields=${fieldsParam}&maxResults=100`
    );

    const issues: SprintIssue[] = (data.issues || []).map((i) => {
      const f = i.fields as { summary: string; status?: { name: string; statusCategory?: { key: string } } } & Record<string, unknown>;
      return {
        key: i.key,
        summary: f.summary,
        status: f.status?.name ?? "Unknown",
        category: f.status?.statusCategory?.key ?? "new",
        points: spId ? ((f[spId] as number | null) ?? null) : null,
        url: `${BASE}/browse/${i.key}`,
      };
    });

    const sum = (arr: SprintIssue[]) => arr.reduce((s, i) => s + (i.points || 0), 0);
    const done = issues.filter((i) => i.category === "done");
    const inprog = issues.filter((i) => i.category === "indeterminate");
    const end = sprint.endDate ? new Date(sprint.endDate) : null;
    const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : null;

    return {
      status: "ok",
      sprint: { name: sprint.name, goal: sprint.goal ?? null, startDate: sprint.startDate ?? null, endDate: sprint.endDate ?? null, daysLeft },
      totals: { totalSP: sum(issues), doneSP: sum(done), inProgressSP: sum(inprog), count: issues.length, doneCount: done.length },
      issues,
    };
  } catch (e) {
    return { status: "error", error: (e as Error).message };
  }
}
