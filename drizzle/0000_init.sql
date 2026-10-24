CREATE TYPE "public"."body_condition" AS ENUM('original_paint', 'repainted_panel', 'repainted', 'accident_damage', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."body_type" AS ENUM('sedan', 'hatchback', 'suv', 'crossover', 'coupe', 'wagon', 'van', 'pickup', 'other');--> statement-breakpoint
CREATE TYPE "public"."car_status" AS ENUM('available', 'reserved', 'sold', 'archived');--> statement-breakpoint
CREATE TYPE "public"."drivetrain" AS ENUM('fwd', 'rwd', 'awd', 'four_wd', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."feature_availability" AS ENUM('present', 'absent', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'plugin_hybrid', 'electric', 'other');--> statement-breakpoint
CREATE TYPE "public"."image_role" AS ENUM('main', 'lifestyle', 'front', 'rear', 'interior', 'detail', 'inspection');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'installment', 'trade_in');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('manual', 'automatic', 'cvt', 'dual_clutch', 'single_speed', 'unknown');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"name_fa" varchar(120) NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brands_name_fa_unique" UNIQUE("name_fa")
);
--> statement-breakpoint
CREATE TABLE "car_features" (
	"car_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"availability" "feature_availability" NOT NULL,
	CONSTRAINT "car_features_car_id_feature_id_pk" PRIMARY KEY("car_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "car_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"asset_path" text NOT NULL,
	"role" "image_role" NOT NULL,
	"sort_order" smallint NOT NULL,
	"alt_fa" varchar(300) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"is_illustrative" boolean DEFAULT false NOT NULL,
	CONSTRAINT "car_images_car_sort_unique" UNIQUE("car_id","sort_order"),
	CONSTRAINT "car_images_sort_nonnegative" CHECK ("car_images"."sort_order" >= 0),
	CONSTRAINT "car_images_dimensions_positive" CHECK ("car_images"."width" > 0 AND "car_images"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "car_specs" (
	"car_id" uuid PRIMARY KEY NOT NULL,
	"body_type" "body_type" NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"transmission" "transmission" NOT NULL,
	"drivetrain" "drivetrain" NOT NULL,
	"engine_cc" integer,
	"power_hp" integer,
	"torque_nm" integer,
	"battery_kwh" numeric(6, 2),
	"range_km" integer,
	"seats" smallint,
	"length_mm" integer,
	"width_mm" integer,
	"height_mm" integer,
	"spec_source" varchar(80) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "car_specs_positive_measurements" CHECK (("car_specs"."engine_cc" IS NULL OR "car_specs"."engine_cc" > 0)
        AND ("car_specs"."power_hp" IS NULL OR "car_specs"."power_hp" > 0)
        AND ("car_specs"."torque_nm" IS NULL OR "car_specs"."torque_nm" > 0)
        AND ("car_specs"."battery_kwh" IS NULL OR "car_specs"."battery_kwh" > 0)
        AND ("car_specs"."range_km" IS NULL OR "car_specs"."range_km" > 0)
        AND ("car_specs"."seats" IS NULL OR "car_specs"."seats" > 0)
        AND ("car_specs"."length_mm" IS NULL OR "car_specs"."length_mm" > 0)
        AND ("car_specs"."width_mm" IS NULL OR "car_specs"."width_mm" > 0)
        AND ("car_specs"."height_mm" IS NULL OR "car_specs"."height_mm" > 0)),
	CONSTRAINT "car_specs_electric_no_engine" CHECK ("car_specs"."fuel_type" <> 'electric' OR "car_specs"."engine_cc" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" varchar(220) NOT NULL,
	"listing_code" varchar(32) NOT NULL,
	"title_fa" varchar(200) NOT NULL,
	"production_year_jalali" smallint NOT NULL,
	"mileage_km" integer NOT NULL,
	"price_toman" bigint NOT NULL,
	"color_code" varchar(40) NOT NULL,
	"color_label_fa" varchar(80) NOT NULL,
	"condition" "body_condition" NOT NULL,
	"condition_note_fa" text,
	"status" "car_status" DEFAULT 'available' NOT NULL,
	"city_fa" varchar(120) NOT NULL,
	"public_seller_name" varchar(120) NOT NULL,
	"description_fa" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cars_slug_unique" UNIQUE("slug"),
	CONSTRAINT "cars_listing_code_unique" UNIQUE("listing_code"),
	CONSTRAINT "cars_mileage_nonnegative" CHECK ("cars"."mileage_km" >= 0),
	CONSTRAINT "cars_price_positive" CHECK ("cars"."price_toman" > 0),
	CONSTRAINT "cars_year_range" CHECK ("cars"."production_year_jalali" BETWEEN 1300 AND 1500),
	CONSTRAINT "cars_published_at_required" CHECK ("cars"."status" = 'archived' OR "cars"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"label_fa" varchar(120) NOT NULL,
	CONSTRAINT "features_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"slug" varchar(180) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"name_fa" varchar(120) NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug"),
	CONSTRAINT "models_brand_name_en_unique" UNIQUE("brand_id","name_en")
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"legal_name" varchar(200) NOT NULL,
	"email" varchar(254),
	"phone" varchar(32),
	"public_contact_label" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"down_payment_toman" bigint,
	"term_months" smallint,
	"annual_rate_bps" integer,
	"terms_fa" text,
	CONSTRAINT "payment_options_car_method_unique" UNIQUE("car_id","method"),
	CONSTRAINT "payment_down_positive" CHECK ("payment_options"."down_payment_toman" IS NULL OR "payment_options"."down_payment_toman" > 0),
	CONSTRAINT "payment_term_positive" CHECK ("payment_options"."term_months" IS NULL OR "payment_options"."term_months" > 0),
	CONSTRAINT "payment_rate_nonnegative" CHECK ("payment_options"."annual_rate_bps" IS NULL OR "payment_options"."annual_rate_bps" >= 0),
	CONSTRAINT "payment_installment_fields" CHECK ("payment_options"."method" = 'installment' OR ("payment_options"."down_payment_toman" IS NULL AND "payment_options"."term_months" IS NULL AND "payment_options"."annual_rate_bps" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "car_features" ADD CONSTRAINT "car_features_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_features" ADD CONSTRAINT "car_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_specs" ADD CONSTRAINT "car_specs_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_options" ADD CONSTRAINT "payment_options_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "car_images_one_main_idx" ON "car_images" USING btree ("car_id") WHERE "car_images"."role" = 'main';--> statement-breakpoint
CREATE INDEX "cars_status_price_idx" ON "cars" USING btree ("status","price_toman","id");--> statement-breakpoint
CREATE INDEX "cars_status_mileage_idx" ON "cars" USING btree ("status","mileage_km","id");--> statement-breakpoint
CREATE INDEX "cars_status_published_idx" ON "cars" USING btree ("status","published_at","id");--> statement-breakpoint
CREATE INDEX "cars_model_status_year_idx" ON "cars" USING btree ("model_id","status","production_year_jalali");--> statement-breakpoint
CREATE INDEX "cars_owner_id_idx" ON "cars" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "models_brand_id_idx" ON "models" USING btree ("brand_id");