export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Parse a pasted block into {title, url} items. Supports markdown links,
 *  "Title | url", "Title <tab> url", trailing bare URLs, or plain titles. */
export function parseItems(text: string): { title: string; url: string | null }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      let m = line.match(/^\[(.+?)\]\((https?:\/\/\S+)\)/);
      if (m) return { title: m[1].trim(), url: m[2] };
      m = line.match(/^(.*?)[|\t]+\s*(https?:\/\/\S+)\s*$/);
      if (m) return { title: m[1].trim() || m[2], url: m[2] };
      m = line.match(/^(.*?)(https?:\/\/\S+)\s*$/);
      if (m) return { title: m[1].trim() || m[2], url: m[2] };
      return { title: line, url: null };
    });
}
