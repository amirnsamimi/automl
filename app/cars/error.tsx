"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertIcon } from "@/components/icons";

export default function CarsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error instanceof Error ? error.message : "inventory error");
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <AlertIcon size={40} className="text-danger-ink" />
      <h1 className="text-2xl font-black">بارگذاری خودروها ناموفق بود</h1>
      <p className="text-muted">اتصال را بررسی کنید و دوباره تلاش کنید. فیلترهای شما در نشانی صفحه حفظ شده‌اند.</p>
      <div className="flex gap-3">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          تلاش دوباره
        </button>
        <Link href="/cars" className="btn-secondary">
          همه خودروها
        </Link>
      </div>
    </div>
  );
}
