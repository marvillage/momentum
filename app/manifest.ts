import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Momentum — Daily Operator",
    short_name: "Momentum",
    description: "Your personal daily manager",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      // Inline SVG mark — no asset file needed. iOS falls back to a screenshot
      // if it can't use this; you can drop in PNG icons later for a custom glyph.
      {
        src:
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="#0b0b0c"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="200" font-weight="900" fill="#c6f833" text-anchor="middle" dominant-baseline="middle">M/</text></svg>'
          ),
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
