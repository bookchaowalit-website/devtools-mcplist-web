import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/components/mcp-views";
import "./globals.css";

// The font variables sit on <html>: the Reader shell tokens live on :root and read them from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "A curated directory of Model Context Protocol (MCP) servers: what each one does, its tools and their input schemas.";

export const metadata: Metadata = {
  title: { default: "MCP List | Bookchaowalit", template: "%s | MCP List" },
  description,
  keywords: ["MCP", "Model Context Protocol", "AI tools", "Server directory"],
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: "MCP List | Bookchaowalit", description, siteName: "Bookchaowalit" },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MCP List",
  url: SITE,
  author: { "@type": "Person", name: "Bookchaowalit", url: "https://bookchaowalit.com" },
  potentialAction: { "@type": "SearchAction", target: SITE + "/?q={search_term}", "query-input": "required name=search_term" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable + " " + geistMono.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
