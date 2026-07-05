"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/overview", label: "Overview" },
  { href: "/targets", label: "Targets" },
  { href: "/results", label: "Results" },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">RedditPulse</span>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLink = (link: (typeof LINKS)[number], onNavigate?: () => void) => {
    const active = pathname?.startsWith(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        className={`group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
        )}
        {link.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <BrandMark />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {open ? (
              <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden sticky top-[57px] z-20 flex flex-col gap-1 border-b border-border bg-surface p-3">
          {LINKS.map((link) => navLink(link, () => setOpen(false)))}
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-r md:border-border md:bg-surface md:p-4">
        <div className="px-2 pb-6 pt-1">
          <BrandMark />
        </div>

        {LINKS.map((link) => navLink(link))}

        <div className="mt-auto px-2 pt-6 text-xs text-muted">Keyword · Phrase · Subreddit</div>
      </nav>
    </>
  );
}
