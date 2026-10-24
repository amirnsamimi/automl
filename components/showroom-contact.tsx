import Link from "next/link";
import { PhoneIcon } from "./icons";

export function ShowroomContactButton({ listingCode, className = "" }: { listingCode: string; className?: string }) {
  return (
    <Link href={`/showroom?listing=${encodeURIComponent(listingCode)}`} className={`btn-primary ${className}`}>
      <PhoneIcon size={18} />
      تماس با نمایشگاه
    </Link>
  );
}

export function ShowroomCard({ sellerName, city }: { sellerName: string; city: string }) {
  return (
    <div className="rounded-card bg-mint p-6">
      <p className="text-xl font-black">{sellerName}</p>
      <p className="mt-2 text-sm text-ink/70">{city} · هماهنگی بازدید پیش از مراجعه</p>
      <p className="mt-3 text-sm text-ink/70">اطلاعات مالک نزد نمایشگاه محفوظ است.</p>
    </div>
  );
}
