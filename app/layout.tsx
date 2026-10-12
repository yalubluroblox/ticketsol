import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticketsol — your ticket to the moment",
  description: "Live music tickets. Verified ownership and fair resale on Solana.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
