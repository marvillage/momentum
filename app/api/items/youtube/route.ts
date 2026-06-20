import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUserId } from "@/lib/auth";
import { parsePlaylistId, fetchPlaylist, youtubeEnabled } from "@/lib/youtube";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!youtubeEnabled()) return NextResponse.json({ error: "YouTube import isn't configured (no YOUTUBE_API_KEY)." }, { status: 400 });

  const { activityId, playlist, mode } = await req.json();
  const act = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!act || act.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const id = parsePlaylistId(playlist || "");
  if (!id) return NextResponse.json({ error: "Couldn't read a playlist ID from that link." }, { status: 400 });

  let videos: { title: string; url: string }[];
  try {
    videos = await fetchPlaylist(id);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "YouTube fetch failed" }, { status: 502 });
  }
  if (videos.length === 0) return NextResponse.json({ error: "No videos found in that playlist." }, { status: 400 });

  if (mode === "replace") await prisma.item.deleteMany({ where: { activityId } });
  const max = await prisma.item.aggregate({ where: { activityId }, _max: { order: true } });
  let order = (max._max.order ?? -1) + 1;
  await prisma.item.createMany({ data: videos.map((v) => ({ activityId, title: v.title, url: v.url, order: order++ })) });

  return NextResponse.json({ added: videos.length });
}
