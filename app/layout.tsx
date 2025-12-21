import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "./app-shell";

// Comprehensive SEO metadata for better search visibility and social sharing
export const metadata: Metadata = {
  title: {
    default: "Provision WorkSuite | Project Management & Collaboration",
    template: "%s | Provision WorkSuite",
  },
  description:
    "Provision WorkSuite is a comprehensive project management platform for agencies and teams. Manage projects, track time, collaborate with your team, and deliver exceptional results.",
  keywords: [
    "project management",
    "team collaboration",
    "time tracking",
    "task management",
    "agency tools",
    "project tracking",
    "workflow management",
  ],
  authors: [{ name: "Provision WorkSuite Team" }],
  creator: "Provision WorkSuite",
  publisher: "Provision WorkSuite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Provision WorkSuite | Project Management & Collaboration",
    description:
      "Comprehensive project management platform for agencies and teams. Manage projects, track time, and collaborate effectively.",
    siteName: "Provision WorkSuite",
  },
  twitter: {
    card: "summary_large_image",
    title: "Provision WorkSuite | Project Management & Collaboration",
    description:
      "Comprehensive project management platform for agencies and teams.",
    creator: "@provisionworksuite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
