import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://automl.amirsamimi.com"),
  title: {
    default: "Auto ML · نمایشگاه خودروهای منتخب",
    template: "%s · Auto ML",
  },
  description: "خرید خودروی کارکرده از نمایشگاه Auto ML با اطلاعات شفاف، مقایسه و روش‌های پرداخت متنوع.",
};

export const viewport: Viewport = {
  themeColor: "#F0F3F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
        >
          پرش به محتوا
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 pb-24 lg:pb-12">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
