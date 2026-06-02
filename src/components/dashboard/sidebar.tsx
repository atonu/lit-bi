"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  FileBarChart,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="size-4" />,
    href: "/",
    active: true,
  },
  {
    label: "Connections",
    icon: <Database className="size-4" />,
    href: "/connections",
  },
  {
    label: "Reports",
    icon: <FileBarChart className="size-4" />,
    href: "/reports",
  },
  {
    label: "Settings",
    icon: <Settings className="size-4" />,
    href: "/settings",
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border/50 px-4">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-5">
          <Sparkles className="size-4 text-white" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-5/20 blur-md" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold tracking-tight text-foreground">
              AURA BI
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Intelligence
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              item.active
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "shrink-0 transition-colors",
                item.active
                  ? "text-chart-1"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {item.icon}
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.active && !collapsed && (
              <div className="ml-auto size-1.5 rounded-full bg-chart-1" />
            )}
          </button>
        ))}
      </nav>

      {/* User area */}
      <div className="border-t border-border/50 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-chart-2 to-chart-4 text-xs font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                Ahmed
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:bg-accent",
          collapsed && "rotate-180"
        )}
      >
        <ChevronLeft className="size-3 text-muted-foreground" />
      </button>
    </aside>
  );
}
