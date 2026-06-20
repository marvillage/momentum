// Fetch a YouTube playlist's videos by reading the playlist page's embedded
// data (no API key needed). Returns [{ title, url }] in playlist order.
// Note: this reads the initial page render (~the first 100 videos).

export function parsePlaylistId(input: string): string | null {
  const s = (input || "").trim();
  const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{12,}$/.test(s)) return s; // bare id
  return null;
}

// Kept for API compatibility; scraping needs no key, so this is always true.
export function youtubeEnabled(): boolean {
  return true;
}

export async function fetchPlaylist(playlistId: string): Promise<{ title: string; url: string }[]> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}&hl=en&gl=US`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`YouTube returned ${res.status}`);
  const html = await res.text();

  const out: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const ch of html.split('"lockupViewModel"').slice(1)) {
    const id = ch.match(/"contentId":"([\w-]{11})"/)?.[1];
    if (!id || seen.has(id)) continue;
    const raw = ch.match(/"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"/)?.[1];
    let title = id;
    if (raw) {
      try {
        title = JSON.parse(`"${raw}"`);
      } catch {
        title = raw;
      }
    }
    seen.add(id);
    out.push({ title, url: `https://www.youtube.com/watch?v=${id}&list=${playlistId}` });
  }
  return out;
}
