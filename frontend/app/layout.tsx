import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LanguageProvider } from "../contexts/language-context";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GroLab — AI-Powered SaaS Idea Generator",
  description:
    "Generate validated SaaS ideas in seconds using real-time data from Google Trends, Product Hunt, and Reddit — powered by Claude AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={jakarta.className}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
