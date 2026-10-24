import { CompareIcon, GridIcon, StoreIcon } from "./icons";

export const NAV_ITEMS = [
  { href: "/cars", label: "خودروها", Icon: GridIcon },
  { href: "/compare", label: "مقایسه", Icon: CompareIcon },
  { href: "/showroom", label: "نمایشگاه", Icon: StoreIcon },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
