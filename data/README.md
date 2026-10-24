# Auto ML — design handoff

Track: Vibe Coder · Candidate: VC-045

This delivery contains visual design and declarative data/specifications only. There is no Next.js application, runnable seeder, executable Drizzle migration, deployment, or working-app recording. The 96-second video is a silent design walkthrough of the screens.

## Start here

- `design/Auto-ML-UI-Design.pdf`: eight presentation boards.
- `design/screens/`: fourteen individual PNG screens, rendered at 2× resolution.
- `mock-seed.json`: thirty fictional listings with normalized relations and deterministic UUIDs.
- `database-schema.json`: PostgreSQL column types, relationships, constraints, indexes and future Drizzle mappings.
- `interaction-contract.json`: filters, URLs, sorting and the scroll-to-pagination transition.
- `design-tokens.json`: the visual system and implementation targets.
- `key-prompts-and-decisions.md`: five prompts and three design Q&As.
- `Auto-ML-All-Car-Images.zip` is delivered separately to avoid duplicating 110+ MB of images inside this package.

## Image status

The image ZIP contains 60 selected generated images (30 alpha main images and 30 different lifestyle settings), 3 superseded sunset alternatives and 3 supplied BMW references. Generated originals remain 1254×1254. Exact 1000×1000 dimensions and 20% margins have not been finalized. No source images were silently replaced. Each seed image path is relative to the image ZIP root; copy `selected/` to your future public image root and prefix the path there.

All car attributes are mock data, not price quotes or verified specifications. Main/lifestyle generation, year, trim, wheels and body details can differ. Replace with verified inventory photography and factual records before launch. The original front/rear BMW references are not represented as new viewpoints for other models.

## Reading the screens

The interface is Persian and RTL. Year is top-left, mileage top-right, with `KM` kept LTR. Brand/model, color and price share a right-aligned hierarchy. Condition uses a label and color, not color alone. All available payment methods are exposed on cards. Larger prices stay explicitly labeled in million toman.

The mobile filter sheet keeps draft edits until Apply. All six brand entries are reachable in a horizontally scrollable chip row or brand picker (not every brand is visible in the static viewport). Desktop uses the same controls in a right sidebar; longer filter content scrolls within the sidebar and retains Apply/Reset actions. Initial desktop viewport shows brand, price and year; condition/payment remain below the fold.

The first ten results render immediately. The next ten append once, then a clear boundary reveals normal pagination. Page 3 begins at result 21 with a limit of ten. Explicit mode supports 10/20/50; changing the limit resets to page 1 and stays explicit. Filter/sort changes reset both paging and the one-append budget. Deep links with page > 1 load a conventional single page. A URL’s content is shareable; whether earlier pages have been accumulated is local presentation state.

Details use one route per listing and an ordered image gallery. Contact belongs to the showroom. The database owner relationship exists, but private owner names, emails and phones must not be exposed publicly. Installment entries with unknown rates show “contact for terms,” never a made-up monthly payment.

Comparison accepts 2–3 distinct car IDs and uses the same normalized fields as details. On mobile, two columns are visible; the third is horizontally reachable with a clear scroll affordance. Car headers remain sticky and row labels remain visible. Highlight differences; show unknown values as “ثبت نشده”, never zero or a false feature absence. The static comparison screen illustrates two cars.

## Architecture for the later build (not implemented)

Requested stack: Next.js frontend and backend, Vercel hosting, Neon PostgreSQL, Drizzle ORM. Intended hostname: automl.amirsamimi.com. DNS and deployment are not changed by this delivery.

Separate the future code into UI components, query parsing, data access, formatting and ownership authorization. Suggested shared units: CarCard, CarGallery, FilterSheet, SortSheet, CompareTable, Pagination, PaymentBadges, ConditionBadge and ShowroomContact. A single filter parser and serializer should power the server and the application’s useFilter hook. A single specification dictionary should power detail and comparison.

Global CSS should define typography, tokens, focus states and RTL rules. Tailwind utilities can compose layout. No authored inline CSS or one-off per-card styles. There is a tension between a literal ban on runtime inline styles and GSAP/Framer, which commonly write animation styles. For the later build, interpret the ban as “no authored inline styling”; keep any library-controlled transforms/opacity isolated to animation wrappers. If all runtime inline styles are forbidden too, use class-based CSS transitions instead of GSAP/Framer. This decision must be resolved before implementation.

Use Framer for one short filter-sheet transition and GSAP only if a discrete nonessential hero motion is retained. Do not ship both engines for a simple opacity effect. Never let two engines control the same node. Reduced-motion disables all nonessential movement. Reserve image dimensions, lazy-load below-fold imagery, avoid scroll hijacking, and keep important content server-rendered. Evaluate animation bundle cost before adding either library.

## Security acceptance requirements

These are requirements for the later implementation, not a certification of this design.

1. Authenticate admin actions and enforce role plus object-level authorization on every write. Public visitors may browse and compare only.
2. Validate and bound all query/body input on the server. Allowlist sort fields and parameterize values. Reject invalid ranges and oversized compare lists.
3. Keep owner data, database credentials and admin responses out of client bundles, logs and shared caches. Public API responses are explicit projections.
4. Protect cookie-authenticated mutations against CSRF, configure secure/HttpOnly/SameSite cookies, and rate-limit expensive routes, contact forms and authentication.
5. Escape user-generated text; allowlist remote image origins, prohibit arbitrary URL fetching and validate uploaded image signatures, size and type.
6. Apply a restrictive CSP and appropriate security headers. Keep audit records for listing/price/owner changes and handle errors without stack or SQL disclosure.
7. Use a least-privilege database role and bounded pooled connections appropriate to the deployment. Validate migrations, backup and restore before production.
8. Select the current OWASP ASVS baseline and verify it during implementation; a static mockup cannot demonstrate compliance.

## Data conventions and import

Seed array order follows foreign-key dependencies in `_meta.import_order`. Import into a clean demo environment in one transaction, or use UUID-based upserts with a clearly defined update policy. Unknown technical data is nullable; feature availability uses present/absent/unknown. Price is stored as bigint toman and transported as a decimal string; million-toman filter values are converted exactly. Numeric JSON values use ASCII digits; only display uses Persian digits.

Year fields are declared Jalali production years, not automatically derived by subtracting 621 from a Gregorian model year. UTC timestamps remain timestamps; render dates in the Persian calendar and Asia/Tehran timezone. No exact production date is invented from a year alone.

The mock dataset includes an empty Peugeot brand so `/cars?brand=پژو&max=900` exercises the zero-result design. The populated BMW example yields four matching cars. Mock counts, IDs, image paths and relational joins were checked during packaging.

## Validation for the later implementation

- On a 360 px viewport, all required card data remains visible, controls have at least 44 px hit areas, and no whole-page horizontal overflow occurs.
- With 30 mock listings, one automatic append stops at 20. Page 3 shows 21–30 without duplicates. Fewer than 20 results never trigger an unnecessary next page.
- Filter, sort, Back/Forward, deep links and shared URLs use the same canonical state. In-flight older responses cannot replace newer results.
- Price/mileage ties use the ID tie-breaker; joins do not duplicate listings with multiple payment methods.
- Comparison retains field alignment across unknown, electric and combustion data. Sold/unavailable IDs produce a clear message rather than silently substituting a different car.
- Owner information never appears in public JSON. Keyboard focus returns to the trigger on sheet close; screen readers receive result-count and loading announcements.

## Reference research

User-provided desktop and mobile screenshots informed the visual direction. Bama informed grouped comparison content, not copied styling or vehicle values:

- https://bama.ir/car
- https://bama.ir/car-reviews
- https://bama.ir/car-comparison/bama-1507-pureplus/bama-1535-615max
- https://owasp.org/www-project-application-security-verification-standard/
- https://orm.drizzle.team/docs/column-types/pg
- https://neon.com/docs/guides/nextjs

References reviewed during this task. Product security, deployment and performance still require implementation and testing.
