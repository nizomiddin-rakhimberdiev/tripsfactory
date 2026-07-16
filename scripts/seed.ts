/**
 * One-time seed: migrates the file-based content (EN base + translation
 * overlays) into Payload CMS, downloading the placeholder images into the
 * Media collection. Idempotent — skips if content already exists.
 *
 * Usage:
 *   npm run seed                       # local sqlite
 *   DATABASE_URL=... npm run seed      # production Postgres
 * Optional: ADMIN_EMAIL / ADMIN_PASSWORD to create the first admin user.
 */
import { getPayload, type Payload } from "payload";
import config from "../src/payload.config";
import { regions, countries, cities } from "../src/lib/content/data/geography";
import { tours } from "../src/lib/content/data/tours";
import { guides } from "../src/lib/content/data/guides";
import type { TranslationOverlay } from "../src/lib/content/translations/schema";

import uz from "../src/lib/content/translations/uz.json" with { type: "json" };
import ru from "../src/lib/content/translations/ru.json" with { type: "json" };
import ja from "../src/lib/content/translations/ja.json" with { type: "json" };
import zh from "../src/lib/content/translations/zh.json" with { type: "json" };
import es from "../src/lib/content/translations/es.json" with { type: "json" };
import it from "../src/lib/content/translations/it.json" with { type: "json" };
import de from "../src/lib/content/translations/de.json" with { type: "json" };

import enMsg from "../src/i18n/messages/en.json" with { type: "json" };
import uzMsg from "../src/i18n/messages/uz.json" with { type: "json" };
import ruMsg from "../src/i18n/messages/ru.json" with { type: "json" };
import jaMsg from "../src/i18n/messages/ja.json" with { type: "json" };
import zhMsg from "../src/i18n/messages/zh.json" with { type: "json" };
import esMsg from "../src/i18n/messages/es.json" with { type: "json" };
import itMsg from "../src/i18n/messages/it.json" with { type: "json" };
import deMsg from "../src/i18n/messages/de.json" with { type: "json" };

type Loc = "uz" | "ru" | "ja" | "zh" | "es" | "it" | "de";
const overlays: Record<Loc, TranslationOverlay> = { uz, ru, ja, zh, es, it, de };
const messages = {
  en: enMsg,
  uz: uzMsg,
  ru: ruMsg,
  ja: jaMsg,
  zh: zhMsg,
  es: esMsg,
  it: itMsg,
  de: deMsg,
};
const LOCALES = Object.keys(overlays) as Loc[];

const rows = (items: string[]) => items.map((text) => ({ text }));

async function uploadImage(
  payload: Payload,
  url: string,
  alt: string,
  cache: Map<string, number>,
): Promise<number> {
  const cached = cache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed ${res.status}: ${url}`);
  const data = Buffer.from(await res.arrayBuffer());
  const name = `${alt.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, name, mimetype: "image/jpeg", size: data.length },
  });
  cache.set(url, doc.id);
  return doc.id;
}

async function main() {
  const payload = await getPayload({ config });

  const existing = await payload.count({ collection: "tours" });
  if (existing.totalDocs > 0) {
    console.log("Content already seeded — skipping. (Delete payload.db to reseed locally.)");
    process.exit(0);
  }

  // Admin user
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const users = await payload.count({ collection: "users" });
    if (users.totalDocs === 0) {
      await payload.create({
        collection: "users",
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      });
      console.log(`Admin user created: ${process.env.ADMIN_EMAIL}`);
    }
  }

  const imageCache = new Map<string, number>();

  // Regions
  const regionIds = new Map<string, number>();
  for (const r of regions) {
    const doc = await payload.create({
      collection: "regions",
      locale: "en",
      data: { slug: r.slug, name: r.name },
    });
    regionIds.set(r.slug, doc.id);
    for (const l of LOCALES) {
      const t = overlays[l].regions?.[r.slug];
      if (t?.name) {
        await payload.update({
          collection: "regions",
          id: doc.id,
          locale: l,
          data: { name: t.name },
        });
      }
    }
  }
  console.log(`Regions: ${regions.length}`);

  // Countries
  const countryIds = new Map<string, number>();
  for (const c of countries) {
    const heroImage = await uploadImage(payload, c.heroImage, c.name, imageCache);
    const doc = await payload.create({
      collection: "countries",
      locale: "en",
      data: {
        slug: c.slug,
        region: regionIds.get(c.regionSlug)!,
        name: c.name,
        intro: c.intro,
        heroImage,
        published: c.published,
      },
    });
    countryIds.set(c.slug, doc.id);
    for (const l of LOCALES) {
      const t = overlays[l].countries?.[c.slug];
      if (t) {
        await payload.update({
          collection: "countries",
          id: doc.id,
          locale: l,
          data: { name: t.name, intro: t.intro },
        });
      }
    }
  }
  console.log(`Countries: ${countries.length}`);

  // Cities
  const cityIds = new Map<string, number>();
  for (const c of cities) {
    const image = await uploadImage(payload, c.image, c.name, imageCache);
    const doc = await payload.create({
      collection: "cities",
      locale: "en",
      data: {
        slug: c.slug,
        country: countryIds.get(c.countrySlug)!,
        name: c.name,
        intro: c.intro,
        recommendedNights: c.recommendedNights,
        attractions: rows(c.attractions),
        image,
      },
    });
    cityIds.set(c.slug, doc.id);
    for (const l of LOCALES) {
      const t = overlays[l].cities?.[c.slug];
      if (t) {
        await payload.update({
          collection: "cities",
          id: doc.id,
          locale: l,
          data: {
            // city names are proper nouns — reuse EN when no translation exists
            name: c.name,
            intro: t.intro,
            ...(t.attractions ? { attractions: rows(t.attractions) } : {}),
          },
        });
      }
    }
  }
  console.log(`Cities: ${cities.length}`);

  // Tours
  for (const t of tours) {
    const heroImage = await uploadImage(payload, t.heroImage, t.title, imageCache);
    const doc = await payload.create({
      collection: "tours",
      locale: "en",
      data: {
        slug: t.slug,
        country: countryIds.get(t.countrySlug)!,
        title: t.title,
        summary: t.summary,
        type: t.type,
        tier: t.tier,
        durationDays: t.durationDays,
        cities: t.citySlugs.map((s) => cityIds.get(s)!),
        priceFromUsd: t.priceFromUsd,
        singleSupplementUsd: t.singleSupplementUsd,
        departures: t.departures,
        itinerary: t.itinerary.map(({ title, description }) => ({
          title,
          description,
        })),
        included: rows(t.included),
        excluded: rows(t.excluded),
        heroImage,
        featured: t.featured,
        published: t.published,
      },
    });
    for (const l of LOCALES) {
      const o = overlays[l].tours?.[t.slug];
      if (o) {
        await payload.update({
          collection: "tours",
          id: doc.id,
          locale: l,
          data: {
            title: o.title,
            summary: o.summary,
            ...(o.itinerary
              ? {
                  itinerary: o.itinerary.map((d) => ({
                    title: d.title ?? "",
                    description: d.description ?? "",
                  })),
                }
              : {}),
            ...(o.included ? { included: rows(o.included) } : {}),
            ...(o.excluded ? { excluded: rows(o.excluded) } : {}),
          },
        });
      }
    }
  }
  console.log(`Tours: ${tours.length}`);

  // Guides
  for (const g of guides) {
    const doc = await payload.create({
      collection: "guides",
      locale: "en",
      data: {
        slug: g.slug,
        country: countryIds.get(g.countrySlug)!,
        title: g.title,
        sections: g.sections,
      },
    });
    for (const l of LOCALES) {
      const o = overlays[l].guides?.[g.slug];
      if (o) {
        await payload.update({
          collection: "guides",
          id: doc.id,
          locale: l,
          data: {
            title: o.title,
            ...(o.sections
              ? {
                  sections: o.sections.map((s) => ({
                    heading: s.heading ?? "",
                    body: s.body ?? "",
                  })),
                }
              : {}),
          },
        });
      }
    }
  }
  console.log(`Guides: ${guides.length}`);

  // Site content global (hero texts come from the message files)
  const heroImage = await uploadImage(
    payload,
    "https://images.unsplash.com/photo-1596306499317-8490232098fa?w=2000",
    "Registan hero",
    imageCache,
  );
  const premiumImage = await uploadImage(
    payload,
    "https://images.unsplash.com/photo-1528164344705-47542687000d?w=2000",
    "Premium hero",
    imageCache,
  );
  await payload.updateGlobal({
    slug: "site-content",
    locale: "en",
    data: {
      hero: {
        image: heroImage,
        title: messages.en.home.heroTitle,
        subtitle: messages.en.home.heroSubtitle,
      },
      premiumHero: {
        image: premiumImage,
        title: messages.en.premium.heroTitle,
        subtitle: messages.en.premium.heroSubtitle,
      },
    },
  });
  for (const l of LOCALES) {
    await payload.updateGlobal({
      slug: "site-content",
      locale: l,
      data: {
        hero: {
          image: heroImage,
          title: messages[l].home.heroTitle,
          subtitle: messages[l].home.heroSubtitle,
        },
        premiumHero: {
          image: premiumImage,
          title: messages[l].premium.heroTitle,
          subtitle: messages[l].premium.heroSubtitle,
        },
      },
    });
  }
  console.log("Site content global seeded");

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
