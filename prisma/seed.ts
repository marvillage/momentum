import { PrismaClient } from "@prisma/client";
import { todayStr } from "../lib/date";
import { hashPassword } from "../lib/crypto-auth";

const prisma = new PrismaClient();

const activities = [
  { slug: "striver", area: "DSA", name: "Striver premium course", cadence: "DAILY", targetCount: 1, unit: "topic", sortOrder: 1 },
  { slug: "leetcode", area: "DSA", name: "LeetCode problems", cadence: "DAILY", targetCount: 4, minCount: 3, unit: "questions", sortOrder: 2 },
  { slug: "ml-playlist", area: "ML", name: "ML course video", cadence: "DAILY", targetCount: 1, unit: "video", sortOrder: 3 },
  { slug: "ml-project", area: "ML", name: "ML project", cadence: "DAILY", targetCount: 1, unit: "session", sortOrder: 4 },
  { slug: "intern-prep", area: "CAREER", name: "Intern prep — OOP & JavaScript", cadence: "DAILY", targetCount: 1, sortOrder: 5 },
  { slug: "lld", area: "CAREER", name: "LLD", cadence: "DAILY", targetCount: 1, sortOrder: 6 },
  { slug: "hld", area: "CAREER", name: "HLD", cadence: "DAILY", targetCount: 1, active: false, sortOrder: 7 },
  { slug: "job-apply", area: "CAREER", name: "Apply to jobs", cadence: "DAILY", targetCount: 1, unit: "applications", sortOrder: 9 },
  { slug: "medium", area: "WRITING", name: "Medium story", cadence: "WEEKLY", targetCount: 3, weeklyTarget: 3, unit: "story", sortOrder: 10 },
  { slug: "book", area: "WRITING", name: "Write my book", cadence: "DAILY", targetCount: 1, unit: "session", sortOrder: 11 },
  { slug: "tweet", area: "X", name: "Post on X", cadence: "DAILY", targetCount: 10, unit: "tweets", sortOrder: 12 },
  { slug: "gym", area: "GYM", name: "Gym (set your split)", cadence: "DAILY", targetCount: 1, sortOrder: 13 },
  { slug: "matiks", area: "MATIKS", name: "Matiks daily", cadence: "DAILY", targetCount: 1, sortOrder: 14 },
];

const DEPRECATED = ["gate"];

const GROUPS = [
  { slug: "coding", name: "Coding", icon: "💻", kind: "NORMAL", sortOrder: 1 },
  { slug: "writing", name: "Writing", icon: "✍️", kind: "NORMAL", sortOrder: 2 },
  { slug: "social", name: "Social", icon: "📣", kind: "NORMAL", sortOrder: 3 },
  { slug: "brain", name: "Brain", icon: "🧮", kind: "NORMAL", sortOrder: 4 },
  { slug: "gym", name: "Gym", icon: "🏋️", kind: "GYM", sortOrder: 5 },
  { slug: "food", name: "Food", icon: "🍽", kind: "FOOD", sortOrder: 6 },
  { slug: "skin", name: "Skin", icon: "✨", kind: "NORMAL", sortOrder: 7 },
  { slug: "aecad", name: "AECAD", icon: "📋", kind: "JIRA", sortOrder: 8 },
];

const SKINCARE = [
  { slug: "skin-am", name: "AM skincare", icon: "🌅" },
  { slug: "skin-pm", name: "PM skincare", icon: "🌙" },
];

const AREA_TO_GROUP: Record<string, string> = {
  DSA: "coding", ML: "coding", CAREER: "coding",
  WRITING: "writing", X: "social", MATIKS: "brain", HABIT: "brain", GYM: "gym",
};

const ACTIVITY_TYPE: Record<string, string> = {
  leetcode: "PROBLEMS", striver: "VIDEO", "ml-playlist": "VIDEO", gym: "GYM",
};

const lc = (title: string, slug: string) => ({ title, url: `https://leetcode.com/problems/${slug}/` });
const QUEUES: Record<string, { title: string; url: string }[]> = {
  leetcode: [
    lc("Two Sum", "two-sum"), lc("Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock"),
    lc("Contains Duplicate", "contains-duplicate"), lc("Product of Array Except Self", "product-of-array-except-self"),
    lc("Maximum Subarray", "maximum-subarray"), lc("Maximum Product Subarray", "maximum-product-subarray"),
    lc("Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array"),
    lc("Search in Rotated Sorted Array", "search-in-rotated-sorted-array"), lc("3Sum", "3sum"),
    lc("Container With Most Water", "container-with-most-water"), lc("Valid Parentheses", "valid-parentheses"),
    lc("Valid Anagram", "valid-anagram"), lc("Valid Palindrome", "valid-palindrome"),
    lc("Group Anagrams", "group-anagrams"),
    lc("Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters"),
    lc("Longest Repeating Character Replacement", "longest-repeating-character-replacement"),
    lc("Minimum Window Substring", "minimum-window-substring"), lc("Top K Frequent Elements", "top-k-frequent-elements"),
    lc("Longest Consecutive Sequence", "longest-consecutive-sequence"), lc("Reverse Linked List", "reverse-linked-list"),
    lc("Merge Two Sorted Lists", "merge-two-sorted-lists"), lc("Linked List Cycle", "linked-list-cycle"),
    lc("Reorder List", "reorder-list"), lc("Remove Nth Node From End of List", "remove-nth-node-from-end-of-list"),
    lc("Merge k Sorted Lists", "merge-k-sorted-lists"), lc("Invert Binary Tree", "invert-binary-tree"),
    lc("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree"), lc("Same Tree", "same-tree"),
    lc("Subtree of Another Tree", "subtree-of-another-tree"),
    lc("Lowest Common Ancestor of a BST", "lowest-common-ancestor-of-a-binary-search-tree"),
    lc("Binary Tree Level Order Traversal", "binary-tree-level-order-traversal"),
    lc("Validate Binary Search Tree", "validate-binary-search-tree"),
    lc("Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst"),
    lc("Construct Binary Tree from Preorder and Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal"),
    lc("Number of Islands", "number-of-islands"), lc("Clone Graph", "clone-graph"),
    lc("Course Schedule", "course-schedule"), lc("Pacific Atlantic Water Flow", "pacific-atlantic-water-flow"),
    lc("Climbing Stairs", "climbing-stairs"), lc("Coin Change", "coin-change"),
    lc("Longest Increasing Subsequence", "longest-increasing-subsequence"), lc("Word Break", "word-break"),
    lc("House Robber", "house-robber"), lc("House Robber II", "house-robber-ii"),
    lc("Unique Paths", "unique-paths"), lc("Jump Game", "jump-game"), lc("Merge Intervals", "merge-intervals"),
    lc("Insert Interval", "insert-interval"), lc("Set Matrix Zeroes", "set-matrix-zeroes"),
    lc("Spiral Matrix", "spiral-matrix"),
  ],
};

async function main() {
  // 1. Seeded account.
  const kush = await prisma.user.upsert({
    where: { username: "kush" },
    update: {},
    create: { username: "kush", passwordHash: hashPassword("112233"), name: "Kush", onboarded: true },
  });
  const userId = kush.id;

  // 2. Adopt any pre-multi-user rows into the kush account.
  await prisma.group.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.activity.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.taskInstance.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.gymExercise.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.bodyWeight.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.channel.updateMany({ where: { userId: null }, data: { userId } });
  await prisma.foodLog.updateMany({ where: { userId: null }, data: { userId } });

  await prisma.settings.upsert({ where: { userId }, update: {}, create: { userId } });

  // 3. Activities.
  for (const a of activities) {
    await prisma.activity.upsert({ where: { userId_slug: { userId, slug: a.slug } }, update: a, create: { ...a, userId } });
  }
  for (const slug of DEPRECATED) await prisma.activity.deleteMany({ where: { userId, slug } });

  // 4. Groups.
  const groupBySlug = new Map<string, string>();
  for (const g of GROUPS) {
    const row = await prisma.group.upsert({ where: { userId_slug: { userId, slug: g.slug } }, update: g, create: { ...g, userId } });
    groupBySlug.set(g.slug, row.id);
  }

  // 5. Skincare routine in the Skin group.
  const skinGroupId = groupBySlug.get("skin");
  for (const [i, s] of SKINCARE.entries()) {
    await prisma.activity.upsert({
      where: { userId_slug: { userId, slug: s.slug } },
      update: {},
      create: { slug: s.slug, name: s.name, icon: s.icon, area: "SKIN", type: "SIMPLE", cadence: "DAILY", targetCount: 1, groupId: skinGroupId, sortOrder: 100 + i, userId },
    });
  }

  // 6. Assign ungrouped activities to a group by area + set type.
  const all = await prisma.activity.findMany({ where: { userId } });
  for (const a of all) {
    const data: { groupId?: string; type?: string } = {};
    if (!a.groupId) data.groupId = groupBySlug.get(AREA_TO_GROUP[a.area] ?? "brain");
    if (a.type === "SIMPLE" && ACTIVITY_TYPE[a.slug]) data.type = ACTIVITY_TYPE[a.slug];
    if (Object.keys(data).length) await prisma.activity.update({ where: { id: a.id }, data });
  }

  // 7. Curated content queues.
  for (const [slug, items] of Object.entries(QUEUES)) {
    const act = await prisma.activity.findFirst({ where: { userId, slug }, include: { _count: { select: { items: true } } } });
    if (!act || act._count.items > 0) continue;
    await prisma.item.createMany({ data: items.map((it, idx) => ({ activityId: act.id, title: it.title, url: it.url, order: idx })) });
    console.log(`Queued ${items.length} items for "${slug}".`);
  }

  // 8. Backfill today's content tasks with their next item.
  const today = todayStr();
  const itemless = await prisma.taskInstance.findMany({ where: { userId, date: today, itemId: null } });
  for (const t of itemless) {
    const used = await prisma.taskInstance.findMany({ where: { activityId: t.activityId, NOT: { itemId: null } }, select: { itemId: true } });
    const usedIds = used.map((u) => u.itemId).filter((x): x is string => !!x);
    const next = await prisma.item.findFirst({ where: { activityId: t.activityId, done: false, id: { notIn: usedIds } }, orderBy: { order: "asc" } });
    if (next) await prisma.taskInstance.update({ where: { id: t.id }, data: { itemId: next.id } });
  }

  console.log(`Seeded user "kush" (password 112233) with ${activities.length} activities.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
