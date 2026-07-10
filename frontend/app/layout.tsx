import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";

// Google Fonts, self-hosted at build time by next/font (no runtime request to
// Google, works offline once built). Inter carries the Latin UI; Noto Sans
// Devanagari is the correct face for the Hindi (हिन्दी) strings. Browsers pick
// per-glyph, so the two are layered in the Tailwind `sans` stack.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Health — PHC Control Room",
  description:
    "AI-driven health centre and supply chain management for Primary Health Centres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoDevanagari.variable}`}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
