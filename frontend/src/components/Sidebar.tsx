"use client";

import { Compass, Home, Users, Activity, AlertTriangle, Radio } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Executive Dashboard", icon: Home },
  { href: "/customers", label: "Customer 360", icon: Users },
  { href: "/timeline", label: "Journey Timeline", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/alerts", label: "Live Alerts", icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <Link href="/" className="font-bold text-xl tracking-tighter text-primary flex items-center gap-2">
          <Compass className="h-5 w-5" />
          JourneyIQ
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
