import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { normalizeText } from "@/lib/format";

export const metadata: Metadata = {
  title: "نمایشگاه",
  description: "اطلاعات تماس و هماهنگی بازدید از نمایشگاه Auto ML.",
};

export default function ShowroomPage({ searchParams }: PageProps<"/showroom">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 lg:pt-10">
      <h1 className="text-3xl font-black lg:text-4xl">نمایشگاه Auto ML</h1>
      <Suspense fallback={null}>
        <ListingReference searchParams={searchParams} />
      </Suspense>
      <section className="rounded-card bg-mint p-6">
        <h2 className="text-xl font-black">هماهنگی بازدید</h2>
        <p className="mt-2 text-ink/80">تهران · بازدید فقط با هماهنگی قبلی انجام می‌شود.</p>
        <p className="mt-2 text-sm text-ink/70">
          این نسخه نمایشی است و اطلاعات تماس واقعی هنوز منتشر نشده است. اطلاعات مالکان خودروها نزد نمایشگاه محفوظ می‌ماند و
          به‌صورت عمومی نمایش داده نمی‌شود.
        </p>
      </section>
      <section className="card p-6">
        <h2 className="text-xl font-black">پیش از مراجعه</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-ink/80">
          <li>کد موجودی خودرو را همراه داشته باشید.</li>
          <li>قیمت‌ها و شرایط اقساط پیش از قرارداد با نمایشگاه نهایی می‌شوند.</li>
          <li>بازدید کارشناسی مستقل پیش از خرید توصیه می‌شود.</li>
        </ul>
      </section>
      <Link href="/cars" className="btn-secondary self-start">
        بازگشت به خودروها
      </Link>
    </div>
  );
}

async function ListingReference({ searchParams }: Pick<PageProps<"/showroom">, "searchParams">) {
  const { listing } = await searchParams;
  const raw = Array.isArray(listing) ? listing[0] : listing;
  const code = raw ? normalizeText(raw).toUpperCase() : "";
  if (!/^AML-\d{1,8}$/.test(code)) return null;
  return (
    <p className="card p-5">
      برای پیگیری، کد موجودی{" "}
      <bdi dir="ltr" className="font-black">
        {code}
      </bdi>{" "}
      را به کارشناس نمایشگاه اعلام کنید.
    </p>
  );
}
