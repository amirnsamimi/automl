import type {
  BodyCondition,
  BodyType,
  CarStatus,
  Drivetrain,
  FeatureAvailability,
  FuelType,
  ImageRole,
  PaymentMethod,
  Transmission,
} from "@/db/schema";

export type PublicImage = {
  id: string;
  src: string;
  role: ImageRole;
  alt: string;
  width: number;
  height: number;
  isIllustrative: boolean;
};

export type PublicPaymentOption = {
  method: PaymentMethod;
  /** Toman as decimal string. */
  downPaymentToman: string | null;
  termMonths: number | null;
  annualRateBps: number | null;
  termsFa: string | null;
};

export type PublicSpecs = {
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  engineCc: number | null;
  powerHp: number | null;
  torqueNm: number | null;
  batteryKwh: string | null;
  rangeKm: number | null;
  seats: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  verified: boolean;
};

export type PublicFeature = { code: string; labelFa: string; availability: FeatureAvailability };

export type CarSummary = {
  id: string;
  slug: string;
  listingCode: string;
  titleFa: string;
  brandFa: string;
  productionYearJalali: number;
  mileageKm: number;
  /** Toman as decimal string. */
  priceToman: string;
  colorCode: string;
  colorLabelFa: string;
  condition: BodyCondition;
  status: CarStatus;
  cityFa: string;
  transmission: Transmission | null;
  fuelType: FuelType | null;
  mainImage: PublicImage | null;
  paymentMethods: PaymentMethod[];
};

export type CarDetail = Omit<CarSummary, "paymentMethods"> & {
  modelFa: string;
  brandSlug: string;
  conditionNoteFa: string | null;
  publicSellerName: string;
  descriptionFa: string;
  publishedAt: string | null;
  images: PublicImage[];
  paymentOptions: PublicPaymentOption[];
  specs: PublicSpecs | null;
  features: PublicFeature[];
};

export type BrandOption = { slug: string; nameFa: string; nameEn: string; count: number };

export type CarListResult = {
  items: CarSummary[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
};
