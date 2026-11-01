import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "SkinDay — Dress for the skin you're in today", description: "One selfie -> live skin-state -> makeup + outfit re-computed for today." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
