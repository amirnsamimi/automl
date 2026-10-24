import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const carStatus = pgEnum("car_status", ["available", "reserved", "sold", "archived"]);
export const bodyCondition = pgEnum("body_condition", [
  "original_paint",
  "repainted_panel",
  "repainted",
  "accident_damage",
  "unknown",
]);
export const paymentMethod = pgEnum("payment_method", ["cash", "installment", "trade_in"]);
export const fuelType = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "hybrid",
  "plugin_hybrid",
  "electric",
  "other",
]);
export const transmission = pgEnum("transmission", [
  "manual",
  "automatic",
  "cvt",
  "dual_clutch",
  "single_speed",
  "unknown",
]);
export const drivetrain = pgEnum("drivetrain", ["fwd", "rwd", "awd", "four_wd", "unknown"]);
export const bodyType = pgEnum("body_type", [
  "sedan",
  "hatchback",
  "suv",
  "crossover",
  "coupe",
  "wagon",
  "van",
  "pickup",
  "other",
]);
export const featureAvailability = pgEnum("feature_availability", ["present", "absent", "unknown"]);
export const imageRole = pgEnum("image_role", [
  "main",
  "lifestyle",
  "front",
  "rear",
  "interior",
  "detail",
  "inspection",
]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const owners = pgTable("owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  legalName: varchar("legal_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 254 }),
  phone: varchar("phone", { length: 32 }),
  publicContactLabel: varchar("public_contact_label", { length: 120 }).notNull(),
  createdAt: createdAt(),
});

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 120 }).notNull(),
    nameFa: varchar("name_fa", { length: 120 }).notNull(),
  },
  (t) => [unique("brands_slug_unique").on(t.slug), unique("brands_name_fa_unique").on(t.nameFa)],
);

export const models = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 180 }).notNull(),
    nameEn: varchar("name_en", { length: 120 }).notNull(),
    nameFa: varchar("name_fa", { length: 120 }).notNull(),
  },
  (t) => [
    unique("models_slug_unique").on(t.slug),
    unique("models_brand_name_en_unique").on(t.brandId, t.nameEn),
    index("models_brand_id_idx").on(t.brandId),
  ],
);

export const cars = pgTable(
  "cars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "restrict" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 220 }).notNull(),
    listingCode: varchar("listing_code", { length: 32 }).notNull(),
    titleFa: varchar("title_fa", { length: 200 }).notNull(),
    productionYearJalali: smallint("production_year_jalali").notNull(),
    mileageKm: integer("mileage_km").notNull(),
    priceToman: bigint("price_toman", { mode: "bigint" }).notNull(),
    colorCode: varchar("color_code", { length: 40 }).notNull(),
    colorLabelFa: varchar("color_label_fa", { length: 80 }).notNull(),
    condition: bodyCondition("condition").notNull(),
    conditionNoteFa: text("condition_note_fa"),
    status: carStatus("status").notNull().default("available"),
    cityFa: varchar("city_fa", { length: 120 }).notNull(),
    publicSellerName: varchar("public_seller_name", { length: 120 }).notNull(),
    descriptionFa: text("description_fa").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("cars_slug_unique").on(t.slug),
    unique("cars_listing_code_unique").on(t.listingCode),
    check("cars_mileage_nonnegative", sql`${t.mileageKm} >= 0`),
    check("cars_price_positive", sql`${t.priceToman} > 0`),
    check("cars_year_range", sql`${t.productionYearJalali} BETWEEN 1300 AND 1500`),
    check("cars_published_at_required", sql`${t.status} = 'archived' OR ${t.publishedAt} IS NOT NULL`),
    index("cars_status_price_idx").on(t.status, t.priceToman, t.id),
    index("cars_status_mileage_idx").on(t.status, t.mileageKm, t.id),
    index("cars_status_published_idx").on(t.status, t.publishedAt, t.id),
    index("cars_model_status_year_idx").on(t.modelId, t.status, t.productionYearJalali),
    index("cars_owner_id_idx").on(t.ownerId),
  ],
);

export const carImages = pgTable(
  "car_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    carId: uuid("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    assetPath: text("asset_path").notNull(),
    role: imageRole("role").notNull(),
    sortOrder: smallint("sort_order").notNull(),
    altFa: varchar("alt_fa", { length: 300 }).notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    isIllustrative: boolean("is_illustrative").notNull().default(false),
  },
  (t) => [
    unique("car_images_car_sort_unique").on(t.carId, t.sortOrder),
    uniqueIndex("car_images_one_main_idx").on(t.carId).where(sql`${t.role} = 'main'`),
    check("car_images_sort_nonnegative", sql`${t.sortOrder} >= 0`),
    check("car_images_dimensions_positive", sql`${t.width} > 0 AND ${t.height} > 0`),
  ],
);

export const paymentOptions = pgTable(
  "payment_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    carId: uuid("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    method: paymentMethod("method").notNull(),
    downPaymentToman: bigint("down_payment_toman", { mode: "bigint" }),
    termMonths: smallint("term_months"),
    annualRateBps: integer("annual_rate_bps"),
    termsFa: text("terms_fa"),
  },
  (t) => [
    unique("payment_options_car_method_unique").on(t.carId, t.method),
    check("payment_down_positive", sql`${t.downPaymentToman} IS NULL OR ${t.downPaymentToman} > 0`),
    check("payment_term_positive", sql`${t.termMonths} IS NULL OR ${t.termMonths} > 0`),
    check("payment_rate_nonnegative", sql`${t.annualRateBps} IS NULL OR ${t.annualRateBps} >= 0`),
    check(
      "payment_installment_fields",
      sql`${t.method} = 'installment' OR (${t.downPaymentToman} IS NULL AND ${t.termMonths} IS NULL AND ${t.annualRateBps} IS NULL)`,
    ),
  ],
);

export const carSpecs = pgTable(
  "car_specs",
  {
    carId: uuid("car_id")
      .primaryKey()
      .references(() => cars.id, { onDelete: "cascade" }),
    bodyType: bodyType("body_type").notNull(),
    fuelType: fuelType("fuel_type").notNull(),
    transmission: transmission("transmission").notNull(),
    drivetrain: drivetrain("drivetrain").notNull(),
    engineCc: integer("engine_cc"),
    powerHp: integer("power_hp"),
    torqueNm: integer("torque_nm"),
    batteryKwh: numeric("battery_kwh", { precision: 6, scale: 2 }),
    rangeKm: integer("range_km"),
    seats: smallint("seats"),
    lengthMm: integer("length_mm"),
    widthMm: integer("width_mm"),
    heightMm: integer("height_mm"),
    specSource: varchar("spec_source", { length: 80 }).notNull(),
    verified: boolean("verified").notNull().default(false),
  },
  (t) => [
    check(
      "car_specs_positive_measurements",
      sql`(${t.engineCc} IS NULL OR ${t.engineCc} > 0)
        AND (${t.powerHp} IS NULL OR ${t.powerHp} > 0)
        AND (${t.torqueNm} IS NULL OR ${t.torqueNm} > 0)
        AND (${t.batteryKwh} IS NULL OR ${t.batteryKwh} > 0)
        AND (${t.rangeKm} IS NULL OR ${t.rangeKm} > 0)
        AND (${t.seats} IS NULL OR ${t.seats} > 0)
        AND (${t.lengthMm} IS NULL OR ${t.lengthMm} > 0)
        AND (${t.widthMm} IS NULL OR ${t.widthMm} > 0)
        AND (${t.heightMm} IS NULL OR ${t.heightMm} > 0)`,
    ),
    check("car_specs_electric_no_engine", sql`${t.fuelType} <> 'electric' OR ${t.engineCc} IS NULL`),
  ],
);

export const features = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 80 }).notNull(),
    labelFa: varchar("label_fa", { length: 120 }).notNull(),
  },
  (t) => [unique("features_code_unique").on(t.code)],
);

export const carFeatures = pgTable(
  "car_features",
  {
    carId: uuid("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    availability: featureAvailability("availability").notNull(),
  },
  (t) => [primaryKey({ columns: [t.carId, t.featureId] })],
);

export type BodyCondition = (typeof bodyCondition.enumValues)[number];
export type PaymentMethod = (typeof paymentMethod.enumValues)[number];
export type CarStatus = (typeof carStatus.enumValues)[number];
export type FuelType = (typeof fuelType.enumValues)[number];
export type Transmission = (typeof transmission.enumValues)[number];
export type Drivetrain = (typeof drivetrain.enumValues)[number];
export type BodyType = (typeof bodyType.enumValues)[number];
export type FeatureAvailability = (typeof featureAvailability.enumValues)[number];
export type ImageRole = (typeof imageRole.enumValues)[number];
