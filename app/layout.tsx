import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import "./shell.css";
import "./viz.css";

const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], display: "swap" });
const plexCond = IBM_Plex_Sans_Condensed({ variable: "--font-plex-cond", subsets: ["latin", "cyrillic"], weight: ["500", "600", "700"], display: "swap" });
const plexAr = IBM_Plex_Sans_Arabic({ variable: "--font-plex-ar", subsets: ["arabic"], weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "Benchmarking Global Prosperity",
  description: "Compare countries on food, poverty, health and education indicators, and trace every finding to its UN source.",
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#eef2f6" }, { media: "(prefers-color-scheme: dark)", color: "#07111c" }] };

// Sets theme and language before first paint so nothing flashes.
const boot = `try{var t=localStorage.getItem("bgp-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;var l=new URLSearchParams(location.search).get("lang")||localStorage.getItem("bgp-lang")||"en";document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${plex.variable} ${plexCond.variable} ${plexAr.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: boot }} /></head>
      <body>{children}</body>
    </html>
  );
}
