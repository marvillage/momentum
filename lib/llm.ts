// Provider-agnostic LLM layer. Default: Google Gemini free tier. To swap in
// your own model later, reimplement generateStructured() — nothing else changes.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function aiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Call the LLM and get back JSON validated against a (Gemini/OpenAPI-subset) schema.
export async function generateStructured<T>(system: string, prompt: string, schema: object): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI not configured (no GEMINI_API_KEY)");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.4 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty AI response");
  return JSON.parse(text) as T;
}

// ---- Activity spec ----
export type ActivitySpec = {
  name: string;
  icon: string;
  area: string;
  type: string; // SIMPLE | PROBLEMS | VIDEO | GYM | WEEKLY | ARTICLE
  group: string; // suggested group name (reuse existing where sensible)
  cadence: string; // DAILY | WEEKDAYS | DAYS | EVERY_N | WEEKLY
  daysOfWeek: number[]; // 1..7 when DAYS
  everyNDays: number; // when EVERY_N
  targetCount: number;
  unit: string;
  metrics: { label: string; unit: string; kind: string }[];
  contentType: string; // NONE | YOUTUBE | LEETCODE
  leetcodeTrack: string; // blind75 | neetcode150 | striver-a2z | none
  description: string;
};

const SPEC_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    icon: { type: "STRING", description: "a single emoji" },
    area: { type: "STRING", enum: ["DSA", "ML", "CAREER", "WRITING", "X", "MATIKS", "GYM", "SKIN", "HABIT"] },
    type: { type: "STRING", enum: ["SIMPLE", "PROBLEMS", "VIDEO", "GYM", "WEEKLY", "ARTICLE"] },
    group: { type: "STRING", description: "navbar group name; reuse an existing one if it fits" },
    cadence: { type: "STRING", enum: ["DAILY", "WEEKDAYS", "DAYS", "EVERY_N", "WEEKLY"] },
    daysOfWeek: { type: "ARRAY", items: { type: "INTEGER" } },
    everyNDays: { type: "INTEGER" },
    targetCount: { type: "INTEGER" },
    unit: { type: "STRING" },
    metrics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          unit: { type: "STRING" },
          kind: { type: "STRING", enum: ["NUMBER", "COUNT", "WEIGHT", "DURATION", "RATING"] },
        },
        required: ["label", "kind"],
      },
    },
    contentType: { type: "STRING", enum: ["NONE", "YOUTUBE", "LEETCODE"] },
    leetcodeTrack: { type: "STRING", enum: ["blind75", "neetcode150", "striver-a2z", "none"] },
    description: { type: "STRING" },
  },
  required: ["name", "icon", "area", "type", "group", "cadence", "targetCount", "metrics", "contentType", "leetcodeTrack"],
};

export async function parseActivitySpec(prompt: string, existingGroups: string[]): Promise<ActivitySpec> {
  const system = [
    "You convert a short description of something a person wants to track into a structured activity for a habit/goal app.",
    "Decide the best type: PROBLEMS = coding/LeetCode practice (set leetcodeTrack), VIDEO = a course/playlist to watch, GYM = ONLY weightlifting/strength training that uses a weekday split with exercises & weights, ARTICLE = publishing on set days, WEEKLY = a per-week goal, SIMPLE = anything else (a daily checkbox, a counter, or a tracked activity like running/cardio/yoga/meditation — use metrics for its numbers).",
    "For running, cycling, walking, yoga, meditation, water, reading etc. use SIMPLE with metrics — NOT GYM.",
    "metrics = numeric things worth logging daily for this activity (e.g. running → distance km, pace; reading → pages; meditation → minutes; mood → rating 1-5). Use 0-3 metrics; empty if none make sense.",
    "cadence: DAILY (every day), WEEKDAYS, DAYS (specific weekdays → fill daysOfWeek with 1=Mon..7=Sun), EVERY_N (every N days → fill everyNDays), WEEKLY (a weekly target).",
    "targetCount = how many per occurrence (e.g. LeetCode 4/day → 4; a simple habit → 1).",
    "contentType: LEETCODE if it's coding practice (pick a track), YOUTUBE if a video course/playlist, else NONE.",
    `Reuse one of these existing group names when it fits, else propose a short new one: ${existingGroups.join(", ") || "(none yet)"}.`,
    "Pick a fitting emoji icon. Keep name concise.",
  ].join(" ");
  return generateStructured<ActivitySpec>(system, prompt, SPEC_SCHEMA);
}
