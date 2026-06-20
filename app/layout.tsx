import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Momentum — Daily Operator",
  description: "Your personal daily manager",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Momentum",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // use the full iPhone screen incl. notch area
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ground text-ink">
        <Nav />
        <main
          className="flex-1 w-full max-w-3xl mx-auto px-5 pt-8"
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
