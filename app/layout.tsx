import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vantage — Cinematic property tours from a few photos",
  description:
    "Upload a few photos of a listing and get a broker-grade walkthrough video in minutes. No crew, no drone, no editing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
