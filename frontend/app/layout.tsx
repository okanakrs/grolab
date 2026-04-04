import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "../contexts/language-context";
import { Footer } from "../components/footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GroLab — AI-Powered SaaS Idea Generator",
  description:
    "Generate validated SaaS ideas backed by real market data from Product Hunt, Reddit, and Google Trends.",
  metadataBase: new URL("https://grolab.app"),
  openGraph: {
    title: "GroLab — AI-Powered SaaS Idea Generator",
    description: "Generate validated SaaS ideas backed by real market data.",
    url: "https://grolab.app",
    siteName: "GroLab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GroLab — AI-Powered SaaS Idea Generator",
    description: "Generate validated SaaS ideas backed by real market data.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={jakarta.className}>
        <LanguageProvider>
          {children}
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
