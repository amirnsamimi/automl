# Key prompts and design decisions

## Five reusable prompts

1. Design a Persian RTL, mobile-first used-car inventory for Auto ML. Reference white rounded cards, black pill controls and a subtle mint accent. Use the supplied car images. Show year, mileage in KM, body-condition badge, brand/model, color, million-toman price and every available payment method. Preserve readable hierarchy and touch targets.
2. Design mobile filter and sorting sheets. Brand plus inclusive price bounds in million toman and Jalali year bounds. Draft filters apply only on confirmation. Include price ascending/descending and mileage ascending/descending, empty results and validation states.
3. Design a listing detail page with all available images, an ordered gallery, condition, shared technical fields, payment methods and a sticky showroom contact CTA. Keep database owner identity private. Do not present fictional inspection claims or calculated loan payments as verified.
4. Design a comparison page for up to three cars using shared normalized keys and units. Show two columns on mobile with access to the third, sticky headers, a differences-only toggle and explicit unknown values. Reuse the details-page data.
5. Design the browsing boundary: initial 10 items, one automatic append of 10 more, then standard numbered pagination. Show page 3, page-size controls, loading failure with retry, and zero results without losing filters. Deliver static visual artifacts and a declarative handoff, no app code.

## Three short design Q&As

The assignment’s original three questions were not supplied. These are three relevant design decisions, not answers to unseen questions.

**Why stop infinite scroll after 20?** It makes early exploration easy while giving users predictable navigation, a reachable end and shareable page links.

**Why use the URL for applied filters?** The URL lets people share and revisit the same query, and gives client/server filtering a single canonical input. Results can still change when live inventory changes.

**Where does the owner belong?** Every car has a required owner foreign key, but public screens expose the showroom’s contact identity. Private owner details remain in authorized backend workflows.
