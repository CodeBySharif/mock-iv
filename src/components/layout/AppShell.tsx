"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

function navClass(active: boolean) {
  return active
    ? "rounded-lg bg-brand px-3 py-2 text-brand-foreground"
    : "rounded-lg px-3 py-2 text-muted hover:bg-background";
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 flex-col border-r border-border bg-surface">
        <p className="p-4 font-display text-lg font-semibold">App</p>
        <nav className="flex flex-col gap-1 p-2">
          <Link href="/" className={navClass(pathname === "/")}>
            Home
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
