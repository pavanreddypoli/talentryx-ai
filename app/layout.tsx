import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Talentryx AI",
  description: "AI-powered recruiter intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-900 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
