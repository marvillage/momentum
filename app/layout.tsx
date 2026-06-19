import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Momentum — Daily Operator",
  description: "Your personal daily manager",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ground text-ink">
        <Nav />
        <main className="flex-1 w-full max-w-3xl mx-auto px-5 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
