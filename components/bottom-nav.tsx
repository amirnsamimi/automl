"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompareIds } from "./compare-store";
import { NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const compareIds = useCompareIds();
  if (/^\/cars\/[^/]+$/.test(pathname)) return null;

  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3 gap-2 px-4 py-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          const badge = href === "/compare" && compareIds.length > 0 ? compareIds.length : null;
          return (
            <li key={href}>
              <Link
                href={href === "/compare" && compareIds.length >= 2 ? `/compare?ids=${compareIds.join(",")}` : href}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-button text-xs text-muted aria-[current=page]:bg-mint aria-[current=page]:text-green"
              >
                <Icon size={20} />
                <span>{label}</span>
                {badge && (
                  <span className="absolute end-[calc(50%-22px)] top-1 grid size-4 place-items-center rounded-full bg-green text-[10px] text-surface">
                    {badge.toLocaleString("fa-IR")}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
