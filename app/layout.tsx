import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TalentRank AI",
  description: "AI-powered recruiter intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-900">
        {children}
      </body>
    </html>
  );
}
