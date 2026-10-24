import "server-only";
import { and, asc, count, desc, eq, exists, gte, inArray, lte, ne, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/db";
import { brands, carFeatures, carImages, cars, carSpecs, features, models, paymentOptions } from "@/db/schema";
import { matchKey } from "@/lib/format";
import { millionToToman, type Filters } from "@/lib/filters";
import type {
  BrandOption,
  CarDetail,
  CarListResult,
  CarSummary,
  PublicImage,
  PublicPaymentOption,
} from "@/lib/types";

const PAYMENT_ORDER = { cash: 0, installment: 1, trade_in: 2 } as const;

/** Public columns only. Owner columns are intentionally absent. */
const summaryColumns = {
  id: cars.id,
  slug: cars.slug,
  listingCode: cars.listingCode,
  titleFa: cars.titleFa,
  brandFa: brands.nameFa,
  productionYearJalali: cars.productionYearJalali,
  mileageKm: cars.mileageKm,
  priceToman: cars.priceToman,
  colorCode: cars.colorCode,
  colorLabelFa: cars.colorLabelFa,
  condition: cars.condition,
  status: cars.status,
  cityFa: cars.cityFa,
  transmission: carSpecs.transmission,
  fuelType: carSpecs.fuelType,
};

const imageColumns = {
  id: carImages.id,
  carId: carImages.carId,
  src: carImages.assetPath,
  role: carImages.role,
  alt: carImages.altFa,
  width: carImages.width,
  height: carImages.height,
  isIllustrative: carImages.isIllustrative,
};

type ImageRow = PublicImage & { carId: string };

function toImage({ carId: _carId, ...image }: ImageRow): PublicImage {
  return image;
}

const SORTS = {
  newest: [sql`${cars.publishedAt} DESC NULLS LAST`, asc(cars.id)],
  price_asc: [asc(cars.priceToman), asc(cars.id)],
  price_desc: [desc(cars.priceToman), asc(cars.id)],
  mileage_asc: [asc(cars.mileageKm), asc(cars.id)],
  mileage_desc: [desc(cars.mileageKm), asc(cars.id)],
} satisfies Record<Filters["sort"], SQL[]>;

export async function getBrands(): Promise<BrandOption[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cars", "brands");

  const rows = await getDb()
    .select({
      slug: brands.slug,
      nameFa: brands.nameFa,
      nameEn: brands.nameEn,
      count: sql<number>`count(${cars.id})::int`,
    })
    .from(brands)
    .leftJoin(models, eq(models.brandId, brands.id))
    .leftJoin(cars, and(eq(cars.modelId, models.id), eq(cars.status, "available")))
    .groupBy(brands.id)
    .orderBy(sql`count(${cars.id}) DESC`, asc(brands.nameEn));
  return rows;
}

function matchBrand(all: BrandOption[], input: string): BrandOption | null {
  const key = matchKey(input);
  return all.find((b) => [b.nameFa, b.nameEn, b.slug].some((alias) => matchKey(alias) === key)) ?? null;
}

/**
 * Resolves brand inputs (Persian name, English name or slug) to known brands in display order.
 * Inputs that match no brand are returned in `unknown`.
 */
export async function resolveBrands(inputs: string[]): Promise<{ brands: BrandOption[]; unknown: string[] }> {
  const all = await getBrands();
  const matched = new Set<string>();
  const unknown: string[] = [];
  for (const input of inputs) {
    const brand = matchBrand(all, input);
    if (brand) matched.add(brand.slug);
    else unknown.push(input);
  }
  return { brands: all.filter((b) => matched.has(b.slug)), unknown };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function buildWhere(filters: Filters): Promise<SQL | null> {
  const conditions: SQL[] = [eq(cars.status, "available")];

  if (filters.brand?.length) {
    const { brands: matched } = await resolveBrands(filters.brand);
    if (matched.length === 0) return null;
    conditions.push(
      inArray(
        brands.slug,
        matched.map((b) => b.slug),
      ),
    );
  }
  if (filters.min) conditions.push(gte(cars.priceToman, millionToToman(filters.min)));
  if (filters.max) conditions.push(lte(cars.priceToman, millionToToman(filters.max)));
  if (filters.yearMin) conditions.push(gte(cars.productionYearJalali, filters.yearMin));
  if (filters.yearMax) conditions.push(lte(cars.productionYearJalali, filters.yearMax));
  if (filters.condition?.length) conditions.push(inArray(cars.condition, filters.condition));
  if (filters.payment?.length) {
    conditions.push(
      exists(
        getDb()
          .select({ one: sql`1` })
          .from(paymentOptions)
          .where(and(eq(paymentOptions.carId, cars.id), inArray(paymentOptions.method, filters.payment))),
      ),
    );
  }
  if (filters.q) {
    const needle = `%${escapeLike(matchKey(filters.q))}%`;
    const haystack = sql`lower(translate(concat_ws(' ', ${cars.titleFa}, ${cars.listingCode}, ${brands.nameFa}, ${brands.nameEn}, ${models.nameFa}, ${models.nameEn}), ${"\u200c -_"}, ''))`;
    conditions.push(sql`${haystack} LIKE ${needle}`);
  }

  return and(...conditions)!;
}

type SummaryRow = Omit<CarSummary, "mainImage" | "paymentMethods" | "priceToman"> & { priceToman: bigint };

async function attachRelations(rows: SummaryRow[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const db = getDb();
  const [images, payments] = await Promise.all([
    db
      .select(imageColumns)
      .from(carImages)
      .where(and(inArray(carImages.carId, ids), eq(carImages.role, "main"))),
    db
      .select({ carId: paymentOptions.carId, method: paymentOptions.method })
      .from(paymentOptions)
      .where(inArray(paymentOptions.carId, ids)),
  ]);

  return rows.map<CarSummary>((row) => ({
    ...row,
    priceToman: row.priceToman.toString(),
    mainImage: toImageOrNull(images.find((i) => i.carId === row.id)),
    paymentMethods: payments
      .filter((p) => p.carId === row.id)
      .map((p) => p.method)
      .sort((a, b) => PAYMENT_ORDER[a] - PAYMENT_ORDER[b]),
  }));
}

function toImageOrNull(row: ImageRow | undefined) {
  return row ? toImage(row) : null;
}

const detailColumns = {
  ...summaryColumns,
  modelFa: models.nameFa,
  brandSlug: brands.slug,
  conditionNoteFa: cars.conditionNoteFa,
  publicSellerName: cars.publicSellerName,
  descriptionFa: cars.descriptionFa,
  publishedAt: cars.publishedAt,
};

function selectSummaries() {
  return getDb()
    .select(summaryColumns)
    .from(cars)
    .innerJoin(models, eq(models.id, cars.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .leftJoin(carSpecs, eq(carSpecs.carId, cars.id));
}

function selectDetails() {
  return getDb()
    .select(detailColumns)
    .from(cars)
    .innerJoin(models, eq(models.id, cars.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .leftJoin(carSpecs, eq(carSpecs.carId, cars.id));
}

export async function listCars(filters: Filters): Promise<CarListResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");

  const empty = { items: [], total: 0, page: filters.page, limit: filters.limit, hasNext: false };
  const where = await buildWhere(filters);
  if (!where) return empty;

  const offset = (filters.page - 1) * filters.limit;
  const [countRows, rows] = await Promise.all([
    getDb()
      .select({ total: count() })
      .from(cars)
      .innerJoin(models, eq(models.id, cars.modelId))
      .innerJoin(brands, eq(brands.id, models.brandId))
      .where(where),
    selectSummaries()
      .where(where)
      .orderBy(...SORTS[filters.sort])
      .limit(filters.limit)
      .offset(offset),
  ]);

  const total = countRows[0]?.total ?? 0;
  return {
    items: await attachRelations(rows),
    total,
    page: filters.page,
    limit: filters.limit,
    hasNext: offset + rows.length < total,
  };
}

export async function getInventoryCount(): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");
  const rows = await getDb().select({ total: count() }).from(cars).where(eq(cars.status, "available"));
  return rows[0]?.total ?? 0;
}

export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cars");
  const rows = await getDb()
    .select({ slug: cars.slug })
    .from(cars)
    .where(ne(cars.status, "archived"));
  return rows.map((r) => r.slug);
}

async function loadDetails(where: SQL): Promise<CarDetail[]> {
  const db = getDb();
  const rows = await selectDetails().where(and(ne(cars.status, "archived"), where));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [images, payments, specs, featureRows] = await Promise.all([
    db.select(imageColumns).from(carImages).where(inArray(carImages.carId, ids)).orderBy(asc(carImages.sortOrder)),
    db
      .select({
        carId: paymentOptions.carId,
        method: paymentOptions.method,
        downPaymentToman: paymentOptions.downPaymentToman,
        termMonths: paymentOptions.termMonths,
        annualRateBps: paymentOptions.annualRateBps,
        termsFa: paymentOptions.termsFa,
      })
      .from(paymentOptions)
      .where(inArray(paymentOptions.carId, ids)),
    db
      .select({
        carId: carSpecs.carId,
        bodyType: carSpecs.bodyType,
        fuelType: carSpecs.fuelType,
        transmission: carSpecs.transmission,
        drivetrain: carSpecs.drivetrain,
        engineCc: carSpecs.engineCc,
        powerHp: carSpecs.powerHp,
        torqueNm: carSpecs.torqueNm,
        batteryKwh: carSpecs.batteryKwh,
        rangeKm: carSpecs.rangeKm,
        seats: carSpecs.seats,
        lengthMm: carSpecs.lengthMm,
        widthMm: carSpecs.widthMm,
        heightMm: carSpecs.heightMm,
        verified: carSpecs.verified,
      })
      .from(carSpecs)
      .where(inArray(carSpecs.carId, ids)),
    db
      .select({
        carId: carFeatures.carId,
        code: features.code,
        labelFa: features.labelFa,
        availability: carFeatures.availability,
      })
      .from(carFeatures)
      .innerJoin(features, eq(features.id, carFeatures.featureId))
      .where(inArray(carFeatures.carId, ids))
      .orderBy(asc(features.code)),
  ]);

  return rows.map<CarDetail>((row) => {
    const carImagesSorted = images.filter((i) => i.carId === row.id).map(toImage);
    const spec = specs.find((s) => s.carId === row.id);
    return {
      ...row,
      priceToman: row.priceToman.toString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      images: carImagesSorted,
      mainImage: carImagesSorted.find((i) => i.role === "main") ?? carImagesSorted[0] ?? null,
      paymentOptions: payments
        .filter((p) => p.carId === row.id)
        .sort((a, b) => PAYMENT_ORDER[a.method] - PAYMENT_ORDER[b.method])
        .map<PublicPaymentOption>(({ carId: _carId, downPaymentToman, ...p }) => ({
          ...p,
          downPaymentToman: downPaymentToman?.toString() ?? null,
        })),
      specs: spec ? (({ carId: _carId, ...s }) => s)(spec) : null,
      features: featureRows
        .filter((f) => f.carId === row.id)
        .map(({ carId: _carId, ...f }) => f),
    };
  });
}

export async function getCarBySlug(slug: string): Promise<CarDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");
  const [car] = await loadDetails(eq(cars.slug, slug));
  return car ?? null;
}

/** Returns cars in requested order; ids that are missing or archived are reported separately. */
export async function getCarsByIds(ids: string[]): Promise<{ cars: CarDetail[]; missing: string[] }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cars");
  if (ids.length === 0) return { cars: [], missing: [] };
  const found = await loadDetails(inArray(cars.id, ids));
  const ordered = ids.map((id) => found.find((c) => c.id === id)).filter((c): c is CarDetail => Boolean(c));
  return { cars: ordered, missing: ids.filter((id) => !found.some((c) => c.id === id)) };
}
