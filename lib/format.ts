export const UNKNOWN_FA = "ثبت نشده";

const integerFormatter = new Intl.NumberFormat("fa-IR", { useGrouping: true, maximumFractionDigits: 0 });
const plainDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false, maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("fa-IR", { useGrouping: true, maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

/** Converts Persian/Arabic-Indic digits and separators to ASCII so values can be parsed. */
export function normalizeDigits(input: string): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0)!;
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) out += String(code - PERSIAN_ZERO);
    else if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) out += String(code - ARABIC_ZERO);
    else if (char === "٫") out += ".";
    else if (char === "٬" || char === "،") out += ",";
    else out += char;
  }
  return out;
}

/** Unicode-normalizes Persian text: NFC, Arabic yeh/kaf to Persian, collapsed whitespace. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

/** Key for alias matching: also drops ZWNJ, spaces, hyphens and case. */
export function matchKey(input: string): string {
  return normalizeText(input).replace(/[\u200c\s\-_]/g, "").toLowerCase();
}

export function faInt(value: number | bigint | string): string {
  return integerFormatter.format(typeof value === "string" ? BigInt(value) : value);
}

export function faDigits(value: number | string): string {
  return typeof value === "number" ? plainDigits.format(value) : value.replace(/\d/g, (d) => plainDigits.format(Number(d)));
}

export function faDecimal(value: number | string): string {
  return decimalFormatter.format(typeof value === "string" ? Number(value) : value);
}

/** Exact bigint toman to a million-toman display string, e.g. "4950000000" -> "۴٬۹۵۰". */
export function formatMillionToman(priceToman: string | bigint): string {
  const toman = typeof priceToman === "bigint" ? priceToman : BigInt(priceToman);
  const whole = toman / 1_000_000n;
  const remainder = toman % 1_000_000n;
  const wholeText = integerFormatter.format(whole);
  if (remainder === 0n) return wholeText;
  const fraction = remainder.toString().padStart(6, "0").replace(/0+$/, "");
  return `${wholeText}٫${faDigits(fraction)}`;
}

export function formatToman(priceToman: string | bigint): string {
  return integerFormatter.format(typeof priceToman === "bigint" ? priceToman : BigInt(priceToman));
}

export function formatKm(km: number): string {
  return integerFormatter.format(km);
}

export function formatYear(year: number): string {
  return plainDigits.format(year);
}

export function formatJalaliDate(iso: string | Date): string {
  return dateFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatPercentFromBps(bps: number): string {
  return `${decimalFormatter.format(bps / 100)}٪`;
}
