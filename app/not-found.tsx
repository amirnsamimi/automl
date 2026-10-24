import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-black text-green">۴۰۴</p>
      <h1 className="text-2xl font-black">صفحه یا خودروی موردنظر پیدا نشد</h1>
      <p className="text-muted">ممکن است این آگهی فروخته یا بایگانی شده باشد.</p>
      <Link href="/cars" className="btn-primary">
        مشاهده خودروهای موجود
      </Link>
    </div>
  );
}
