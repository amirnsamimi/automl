import { readFileSync } from "node:fs";
import path from "node:path";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../db/schema";
import { publicAssetPath } from "../lib/images";

config({ path: [".env.local", ".env"], quiet: true });
neonConfig.webSocketConstructor = ws;

type Seed = {
  _meta: { import_order: string[] };
  owners: Record<string, unknown>[];
  brands: Record<string, unknown>[];
  models: Record<string, unknown>[];
  cars: Record<string, unknown>[];
  car_images: Record<string, unknown>[];
  payment_options: Record<string, unknown>[];
  car_specs: Record<string, unknown>[];
  features: Record<string, unknown>[];
  car_features: Record<string, unknown>[];
};

const seed: Seed = JSON.parse(readFileSync(path.resolve("data/mock-seed.json"), "utf8"));

const str = (v: unknown) => v as string;
const nullableStr = (v: unknown) => (v ?? null) as string | null;
const num = (v: unknown) => v as number;
const nullableNum = (v: unknown) => (v ?? null) as number | null;
const big = (v: unknown) => BigInt(v as string);
const nullableBig = (v: unknown) => (v == null ? null : BigInt(v as string));
const date = (v: unknown) => new Date(v as string);
const nullableDate = (v: unknown) => (v == null ? null : new Date(v as string));

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema });

  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`TRUNCATE car_features, features, car_specs, payment_options, car_images, cars, models, brands, owners RESTART IDENTITY CASCADE`,
      );

      await tx.insert(schema.owners).values(
        seed.owners.map((o) => ({
          id: str(o.id),
          displayName: str(o.display_name),
          legalName: str(o.legal_name),
          email: nullableStr(o.email),
          phone: nullableStr(o.phone),
          publicContactLabel: str(o.public_contact_label),
          createdAt: date(o.created_at),
        })),
      );

      await tx.insert(schema.brands).values(
        seed.brands.map((b) => ({
          id: str(b.id),
          slug: str(b.slug),
          nameEn: str(b.name_en),
          nameFa: str(b.name_fa),
        })),
      );

      await tx.insert(schema.models).values(
        seed.models.map((m) => ({
          id: str(m.id),
          brandId: str(m.brand_id),
          slug: str(m.slug),
          nameEn: str(m.name_en),
          nameFa: str(m.name_fa),
        })),
      );

      await tx.insert(schema.cars).values(
        seed.cars.map((c) => ({
          id: str(c.id),
          modelId: str(c.model_id),
          ownerId: str(c.owner_id),
          slug: str(c.slug),
          listingCode: str(c.listing_code),
          titleFa: str(c.title_fa),
          productionYearJalali: num(c.production_year_jalali),
          mileageKm: num(c.mileage_km),
          priceToman: big(c.price_toman),
          colorCode: str(c.color_code),
          colorLabelFa: str(c.color_label_fa),
          condition: c.condition as schema.BodyCondition,
          conditionNoteFa: nullableStr(c.condition_note_fa),
          status: c.status as schema.CarStatus,
          cityFa: str(c.city_fa),
          publicSellerName: str(c.public_seller_name),
          descriptionFa: str(c.description_fa),
          publishedAt: nullableDate(c.published_at),
          createdAt: date(c.created_at),
          updatedAt: date(c.updated_at),
        })),
      );

      await tx.insert(schema.carImages).values(
        seed.car_images.map((i) => {
          const asset = publicAssetPath(str(i.asset_path));
          return {
            id: str(i.id),
            carId: str(i.car_id),
            assetPath: asset.src,
            role: i.role as schema.ImageRole,
            sortOrder: num(i.sort_order),
            altFa: str(i.alt_fa),
            width: asset.size,
            height: asset.size,
            isIllustrative: Boolean(i.is_illustrative),
          };
        }),
      );

      await tx.insert(schema.paymentOptions).values(
        seed.payment_options.map((p) => ({
          id: str(p.id),
          carId: str(p.car_id),
          method: p.method as schema.PaymentMethod,
          downPaymentToman: nullableBig(p.down_payment_toman),
          termMonths: nullableNum(p.term_months),
          annualRateBps: nullableNum(p.annual_rate_bps),
          termsFa: nullableStr(p.terms_fa),
        })),
      );

      await tx.insert(schema.carSpecs).values(
        seed.car_specs.map((s) => ({
          carId: str(s.car_id),
          bodyType: s.body_type as schema.BodyType,
          fuelType: s.fuel_type as schema.FuelType,
          transmission: s.transmission as schema.Transmission,
          drivetrain: s.drivetrain as schema.Drivetrain,
          engineCc: nullableNum(s.engine_cc),
          powerHp: nullableNum(s.power_hp),
          torqueNm: nullableNum(s.torque_nm),
          batteryKwh: nullableStr(s.battery_kwh),
          rangeKm: nullableNum(s.range_km),
          seats: nullableNum(s.seats),
          lengthMm: nullableNum(s.length_mm),
          widthMm: nullableNum(s.width_mm),
          heightMm: nullableNum(s.height_mm),
          specSource: str(s.spec_source),
          verified: Boolean(s.verified),
        })),
      );

      await tx.insert(schema.features).values(
        seed.features.map((f) => ({ id: str(f.id), code: str(f.code), labelFa: str(f.label_fa) })),
      );

      await tx.insert(schema.carFeatures).values(
        seed.car_features.map((f) => ({
          carId: str(f.car_id),
          featureId: str(f.feature_id),
          availability: f.availability as schema.FeatureAvailability,
        })),
      );

      const invalid = await tx.execute(sql`
        SELECT c.listing_code FROM cars c
        WHERE c.status IN ('available', 'reserved')
          AND (
            NOT EXISTS (SELECT 1 FROM car_images i WHERE i.car_id = c.id AND i.role = 'main')
            OR NOT EXISTS (SELECT 1 FROM payment_options p WHERE p.car_id = c.id)
            OR EXISTS (
              SELECT 1 FROM payment_options p
              WHERE p.car_id = c.id AND p.down_payment_toman > c.price_toman
            )
          )
      `);
      if (invalid.rows.length > 0) {
        throw new Error(`Listings violate publishing invariants: ${JSON.stringify(invalid.rows)}`);
      }
    });

    console.log(
      `seeded ${seed.cars.length} cars, ${seed.car_images.length} images, ${seed.payment_options.length} payment options`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
