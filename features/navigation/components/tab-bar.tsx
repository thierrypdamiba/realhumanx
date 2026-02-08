"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag, Plus, Code, User, type LucideIcon } from "lucide-react";

export interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isAction?: boolean;
}

const DEFAULT_TABS: TabItem[] = [
  { label: "Feed", href: "/", icon: House },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
  { label: "Create", href: "/create", icon: Plus, isAction: true },
  { label: "Skills", href: "/skills", icon: Code },
  { label: "Profile", href: "/profile", icon: User },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TabBar({ tabs = DEFAULT_TABS }: { tabs?: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50">
      <div className="border-t border-border-subtle bg-surface/90 pb-safe-bottom pl-safe-left pr-safe-right backdrop-blur-xl">
        <div className="mx-auto flex max-w-md">
          {tabs.map((tab) => {
            const active = isActive(tab.href, pathname);
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
                    <Icon size={20} strokeWidth={2.5} className="text-white" />
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2.5 transition-colors duration-150 ${
                  active
                    ? "text-accent-light"
                    : "text-text-dim active:text-text-muted"
                }`}
              >
                <span
                  className={`absolute top-0 h-[2px] w-6 rounded-full transition-all duration-200 ${
                    active
                      ? "scale-x-100 bg-accent"
                      : "scale-x-0 bg-transparent"
                  }`}
                />
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span
                  className={`text-[10px] leading-tight tracking-wide ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
