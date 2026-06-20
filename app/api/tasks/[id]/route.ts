import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action, note, itemId } = await req.json();

  const task = await prisma.taskInstance.findUnique({ where: { id }, include: { activity: true } });
  if (!task || task.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const target = task.activity.targetCount ?? 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};

  if (action === "done") {
    data.status = "DONE";
    data.count = Math.max(task.count, target);
    data.completedAt = new Date();
  } else if (action === "increment") {
    const c = task.count + 1;
    data.count = c;
    if (c >= target) {
      data.status = "DONE";
      data.completedAt = new Date();
    }
  } else if (action === "completeItem") {
    // Check off one queue item: mark it done and advance the day's count.
    if (itemId) await prisma.item.update({ where: { id: itemId }, data: { done: true } });
    const c = task.count + 1;
    data.count = c;
    if (c >= target) {
      data.status = "DONE";
      data.completedAt = new Date();
    }
  } else if (action === "skip") {
    data.status = "SKIPPED";
  } else if (action === "reset") {
    data.status = "PENDING";
    data.count = 0;
    data.completedAt = null;
  } else if (action === "note") {
    data.note = note;
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const updated = await prisma.taskInstance.update({ where: { id }, data });

  if (data.status === "DONE" && task.itemId) {
    await prisma.item.update({ where: { id: task.itemId }, data: { done: true } });
  }
  if (action === "reset" && task.itemId) {
    await prisma.item.update({ where: { id: task.itemId }, data: { done: false } });
  }

  return NextResponse.json(updated);
}
