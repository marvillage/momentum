// Fetch a YouTube playlist's videos via the YouTube Data API.
// Requires a YOUTUBE_API_KEY env var. Returns [{ title, url }].

export function parsePlaylistId(input: string): string | null {
  const s = (input || "").trim();
  const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s; // bare id
  return null;
}

export function youtubeEnabled(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

export async function fetchPlaylist(playlistId: string): Promise<{ title: string; url: string }[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY not set");

  const items: { title: string; url: string }[] = [];
  let pageToken = "";
  for (let page = 0; page < 10; page++) {
    // up to 10 pages × 50 = 500 videos
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", key);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message || `YouTube API error ${res.status}`);
    }
    const data = await res.json();
    for (const it of data.items || []) {
      const title: string = it?.snippet?.title || "";
      const vid: string = it?.snippet?.resourceId?.videoId || "";
      if (!vid || title === "Private video" || title === "Deleted video") continue;
      items.push({ title, url: `https://www.youtube.com/watch?v=${vid}&list=${playlistId}` });
    }
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  return items;
}
