"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Aperture, Clapperboard, MessageSquare, Images, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "New Tour", icon: Clapperboard },
  { href: "/app/chat", label: "Assistant", icon: MessageSquare },
  { href: "/app/tours", label: "My Tours", icon: Images },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  fullName: string | null;
  email: string | null;
  credits: number;
}

export function Sidebar({ fullName, email, credits }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = fullName?.trim() || email?.split("@")[0] || "Agent";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface px-4 py-5">
      <Link href="/" className="flex items-center gap-2 px-2 text-base font-semibold text-ink">
        <Aperture className="h-5 w-5 text-accent" strokeWidth={1.75} />
        Vantage
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-ink text-white" : "text-muted hover:bg-white hover:text-ink"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent-dark">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{displayName}</p>
          <p className="text-xs text-muted">{credits} credits</p>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="text-muted transition-colors hover:text-ink"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
