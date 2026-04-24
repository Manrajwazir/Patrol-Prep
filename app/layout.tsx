// app/layout.tsx
// Root layout. Loads fonts, sets the dark background, wraps all pages.
// The font variables become available as --font-sans, --font-condensed, --font-mono
// inside globals.css.

import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const condensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-condensed",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "patrolprep.",
  description: "Speak it. Ship it. Defensible security documentation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${condensed.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}