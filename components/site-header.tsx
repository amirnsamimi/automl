"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 lg:h-20 lg:px-8">
        <Link href="/cars" className="flex flex-col leading-tight" aria-label="Auto ML، صفحه خودروها">
          <bdi dir="ltr" className="text-2xl font-black tracking-tight lg:text-3xl">
            Auto ML
          </bdi>
          <span className="text-[11px] text-muted lg:hidden">نمایشگاه خودروهای منتخب</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-10 ps-10">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="tap inline-flex items-center text-muted transition-colors hover:text-ink aria-[current=page]:font-bold aria-[current=page]:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <bdi dir="ltr" className="hidden text-sm text-muted lg:inline">
          automl.amirsamimi.com
        </bdi>
      </div>
    </header>
  );
}
