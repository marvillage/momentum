import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seeded from your actual plan. Gym is created empty — you'll fill the split + weights.
const activities = [
  { slug: "striver", area: "DSA", name: "Striver premium course", cadence: "DAILY", targetCount: 1, unit: "topic", sortOrder: 1 },
  { slug: "leetcode", area: "DSA", name: "LeetCode problems", cadence: "DAILY", targetCount: 4, minCount: 3, unit: "questions", sortOrder: 2 },
  { slug: "ml-playlist", area: "ML", name: "ML course video", cadence: "DAILY", targetCount: 1, unit: "video", sortOrder: 3 },
  { slug: "ml-project", area: "ML", name: "ML project", cadence: "DAILY", targetCount: 1, unit: "session", sortOrder: 4 },
  { slug: "intern-prep", area: "CAREER", name: "Intern prep — OOP & JavaScript", cadence: "DAILY", targetCount: 1, sortOrder: 5 },
  { slug: "lld", area: "CAREER", name: "LLD", cadence: "DAILY", targetCount: 1, sortOrder: 6 },
  { slug: "hld", area: "CAREER", name: "HLD", cadence: "DAILY", targetCount: 1, active: false, sortOrder: 7 },
  { slug: "gate", area: "GATE", name: "GATE prep", cadence: "DAILY", targetCount: 1, sortOrder: 8 },
  { slug: "job-apply", area: "CAREER", name: "Apply to jobs", cadence: "DAILY", targetCount: 1, unit: "applications", sortOrder: 9 },
  { slug: "medium", area: "WRITING", name: "Medium story", cadence: "WEEKLY", targetCount: 3, weeklyTarget: 3, unit: "story", sortOrder: 10 },
  { slug: "book", area: "WRITING", name: "Write my book", cadence: "DAILY", targetCount: 1, unit: "session", sortOrder: 11 },
  { slug: "tweet", area: "X", name: "Post on X", cadence: "DAILY", targetCount: 10, unit: "tweets", sortOrder: 12 },
  { slug: "gym", area: "GYM", name: "Gym (set your split)", cadence: "DAILY", targetCount: 1, sortOrder: 13 },
  { slug: "matiks", area: "MATIKS", name: "Matiks daily", cadence: "DAILY", targetCount: 1, sortOrder: 14 },
];

async function main() {
  for (const a of activities) {
    await prisma.activity.upsert({ where: { slug: a.slug }, update: a, create: a });
  }
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  console.log(`Seeded ${activities.length} activities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
