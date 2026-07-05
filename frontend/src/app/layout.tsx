import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedditPulse",
  description: "Manage keyword/phrase/subreddit scraping and browse results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="flex flex-1 min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-auto">
            <div className="mx-auto w-full max-w-6xl p-6 md:p-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
