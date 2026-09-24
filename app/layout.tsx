import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseAnalytics — Modern Dashboard Builder",
  description: "Interactive executive KPI dashboard builder and analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased text-slate-900 bg-slate-950">
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-600">
        {children}
      </body>
    </html>
  );
}
