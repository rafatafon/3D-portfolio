import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { profile } from "@/lib/content";
import {
  shareDescription,
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
  xHandle,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s — Fredy Maldonado" },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    locale: "en_US",
    title: siteTitle,
    description: shareDescription,
  },
  twitter: {
    card: "summary_large_image",
    creator: xHandle,
    title: siteTitle,
    description: shareDescription,
  },
};

export const viewport: Viewport = { themeColor: "#282a27" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
