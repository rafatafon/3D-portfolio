import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fredymaldonado.com"),
  title: "Fredy Maldonado — Welcome to my workspace",
  description:
    "Step inside my workspace. I'm Fredy Maldonado, a software engineer based in Honduras, building thoughtful web applications, AI systems, and automation.",
  openGraph: {
    title: "Fredy Maldonado — Welcome to my workspace",
    description:
      "Software, ideas, and a space for good work. Explore my interactive workspace.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#282a27" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
