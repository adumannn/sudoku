import type { Metadata, Viewport } from "next";
import {
  Shippori_Mincho,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const mincho = Shippori_Mincho({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-mincho",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["500"],
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hako 箱 — a quieter sudoku",
  description:
    "A paper-and-ink sudoku. One box a day, one streak, no upsell ladder. Made in Almaty.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ECE3D0" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${mincho.variable} ${jakarta.variable} ${mono.variable} ${cormorant.variable}`}
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
