import type { NextRequest } from "next/server";
import { listCars } from "@/lib/db/queries";
import { parseFilters } from "@/lib/filters";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`cars:${ip}`, 120, 60_000)) {
    return Response.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const parsed = parseFilters(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return Response.json({ error: "invalid_query", fields: parsed.errors }, { status: 400 });
  }

  try {
    const result = await listCars(parsed.filters);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("GET /api/cars failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
