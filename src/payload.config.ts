import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { r2Storage } from "@payloadcms/storage-r2";
import type { CloudflareContext } from "@opennextjs/cloudflare";
import type { GetPlatformProxyOptions } from "wrangler";
import { APIError } from "payload";
import type {
  Access,
  CollectionConfig,
  CollectionSlug,
  Field,
  GeneratePreviewURL,
  Payload,
} from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.vercel.app";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Cloudflare bindings, resolved before the config is built.
 *
 * On Workers the database connection and the media bucket arrive as bindings
 * rather than environment variables, and `buildConfig` needs both up front —
 * so they are awaited at module scope.
 *
 * Two ways in:
 *
 *   1. `getCloudflareContext` — the real bindings. This is the path on Workers
 *      and during an OpenNext production build.
 *   2. wrangler's platform proxy, behind `CF_LOCAL_BINDINGS=1` — local stand-ins
 *      read out of wrangler.jsonc. This exists for one job: generating the
 *      import map. Payload only writes entries for plugins that are *active*,
 *      so an import map generated without the R2 plugin silently drops its
 *      client upload handler and production /admin renders blank. AGENTS.md
 *      documents that trap for Vercel Blob; R2 has exactly the same one.
 *      It is opt-in because the proxy spawns a workerd process, and the seed
 *      and import scripts must not inherit that.
 *
 * Neither is available under plain `next dev`, `tsx scripts/…` or a CI
 * typecheck, and the config falls back to DATABASE_URL or local sqlite.
 */
async function resolveCloudflare(): Promise<CloudflareContext | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return await getCloudflareContext({ async: true });
  } catch {
    /* not on Workers */
  }

  if (process.env.CF_LOCAL_BINDINGS !== "1") return null;

  try {
    // Assembled at runtime so bundlers do not try to follow the import.
    const { getPlatformProxy } = await import(
      /* webpackIgnore: true */ `${"__wrangler".replaceAll("_", "")}`
    );
    return await getPlatformProxy({
      environment: process.env.CLOUDFLARE_ENV,
      remoteBindings: isProduction,
    } satisfies GetPlatformProxyOptions);
  } catch {
    return null;
  }
}

const cf = await resolveCloudflare();

/**
 * The development database — and a guard rail.
 *
 * Falling back to payload.db is right for `next dev` and the seed scripts. It
 * is badly wrong for a build: prerendering reads the database, so a build that
 * quietly used this file would bake months-old dev content into every static
 * page and deploy it looking perfectly healthy. That already happened once —
 * the deployed pages asked for image filenames that only exist in this file.
 *
 * So in production it refuses rather than falls back. `deploy:cf` sets
 * CF_LOCAL_BINDINGS=1, which is what hands the build the D1 binding.
 */
function localDb() {
  if (isProduction) {
    throw new Error(
      "payload.config: no D1 binding, and a production build must not fall " +
        "back to payload.db — stale content would be prerendered into every " +
        "page. Build with `npm run deploy:cf` (sets CF_LOCAL_BINDINGS=1).",
    );
  }
  return sqliteAdapter({ client: { url: "file:./payload.db" } });
}

/** Reference data anyone may read: regions, cities, guides, media. */
const publicRead: Access = () => true;
const adminOnly: Access = ({ req }) => Boolean(req.user);

/**
 * For collections that carry a `published` flag — tours and countries.
 *
 * `publicRead` returned true unconditionally and the comment beside it claimed
 * it read "everything published", which it did not: the REST API served drafts
 * to anyone who asked. The site's own pages were never affected because they
 * filter on published themselves and go through the local API, but the moment
 * next season's pricing was drafted in Studio it was readable at /api/tours.
 *
 * Admins still see everything; an anonymous caller gets a constrained query.
 */
const publishedOrAdmin: Access = ({ req }) =>
  req.user ? true : { published: { equals: true } };

/**
 * On any content change, tell Next.js to rebuild the affected pages immediately
 * (on-demand revalidation) so admin edits appear on the site right away instead
 * of waiting for the 5-minute ISR window. No-op outside a Next request (scripts).
 */
async function revalidateSite(): Promise<void> {
  try {
    const { revalidatePath } = await import("next/cache");
    const pages = [
      "/[locale]",
      "/[locale]/tours",
      "/[locale]/tours/group",
      "/[locale]/tours/private",
      "/[locale]/tours/[country]/[slug]",
      "/[locale]/destinations",
      "/[locale]/destinations/[region]/[country]",
      "/[locale]/guide",
      "/[locale]/guide/[slug]",
      "/[locale]/premium",
      // Were missing, so an edit to any of these waited out the 5-minute ISR
      // window while the editor assumed the save had not taken.
      "/[locale]/excursions",
      "/[locale]/excursions/[slug]",
      "/[locale]/masterclasses",
      "/[locale]/masterclasses/[slug]",
      "/[locale]/about",
      "/[locale]/contact",
    ];
    for (const p of pages) revalidatePath(p, "page");
  } catch {
    /* not in a Next request context (e.g. seed scripts) — ignore */
  }
}

const revalidateHooks = {
  afterChange: [() => revalidateSite()],
  afterDelete: [() => revalidateSite()],
};

/** Localized text field with an Uzbek admin label + optional help text. */
const locText = (
  name: string,
  label: string,
  opts: { required?: boolean; description?: string } = {},
): Field => ({
  name,
  type: "text",
  label,
  required: opts.required ?? true,
  localized: true,
  admin: opts.description ? { description: opts.description } : undefined,
});

const locArea = (
  name: string,
  label: string,
  opts: { required?: boolean; description?: string } = {},
): Field => ({
  name,
  type: "textarea",
  label,
  required: opts.required ?? true,
  localized: true,
  admin: opts.description ? { description: opts.description } : undefined,
});

/** Shown under every image field — the replace-by-upload instructions. */
const REPLACE_HELP =
  "Rasmni almashtirish: rasm yonidagi ✕ tugmasini bosing, so'ng «Create New» bilan yangi rasm yuklang (yoki faylni shu maydonga tortib tashlang). Eski rasm o'chmaydi — kutubxonada qoladi.";

const imageField = (name: string, label: string): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  label,
  required: true,
  admin: { description: REPLACE_HELP },
});

const galleryField: Field = {
  name: "gallery",
  type: "json",
  label: "Rasmlar galereyasi (karusel)",
  admin: {
    description:
      "Bir nechta rasm qo'shing — sahifada karuselda ko'rinadi. «Rasm qo'shish» tugmasi orqali tanlaysiz.",
  },
};

const slugField: Field = {
  name: "slug",
  type: "text",
  label: "Manzil (slug)",
  required: true,
  unique: true,
  index: true,
  admin: {
    description:
      "Sahifa manzilidagi qism — faqat kichik lotin harflar va defis (masalan: classic-uzbekistan-group-tour). O'zgartirmaslik tavsiya etiladi.",
  },
};

async function resolveSlug(
  payload: Payload,
  collection: CollectionSlug,
  rel: unknown,
): Promise<string> {
  if (rel && typeof rel === "object" && "slug" in rel) {
    return String((rel as { slug: string }).slug);
  }
  if (rel === null || rel === undefined) return "";
  const doc = (await payload
    .findByID({ collection, id: rel as number | string, depth: 0 })
    .catch(() => null)) as { slug?: string } | null;
  return doc?.slug ?? "";
}

const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Foydalanuvchi", plural: "Foydalanuvchilar" },
  auth: {
    /**
     * Payload's default is two hours, which is fine for a public app and wrong
     * for a CMS somebody works in all day: the Studio tab stays open, the token
     * quietly expires, and the next save or import comes back 401 while the
     * page still looks signed in. A week matches how this panel is actually
     * used — one operator, one machine.
     */
    tokenExpiration: 60 * 60 * 24 * 7,
  },
  admin: { useAsTitle: "email", group: "Tizim" },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [],
};

const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Rasm", plural: "Rasmlar" },
  hooks: revalidateHooks,
  admin: {
    group: "Media",
    description:
      "Barcha rasmlar shu yerga yuklanadi. Yuklab bo'lgach, kerakli turga/shaharga/hero'ga ulaysiz. Rasm o'lchamlari uchun docs/IMAGES.md ga qarang.",
  },
  upload: {
    staticDir: path.resolve(dirname, "../media"),
    mimeTypes: ["image/*"],
    // Crop/focal editing is unused by the site and only confused editors —
    // removing it leaves the file card with a clear replace (✕ → upload) flow.
    crop: false,
    focalPoint: false,
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Tavsif (alt)",
      required: true,
      admin: {
        description:
          "Rasmda nima borligini qisqa yozing (SEO va ko'rish qulayligi uchun). Masalan: Registon maydoni kunbotarda.",
      },
    },
  ],
};

const Regions: CollectionConfig = {
  slug: "regions",
  labels: { singular: "Mintaqa", plural: "Mintaqalar" },
  hooks: revalidateHooks,
  admin: { useAsTitle: "name", group: "Kontent" },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [slugField, locText("name", "Nomi")],
};

const previewCountry: GeneratePreviewURL = async (doc, { req, locale }) => {
  const loc = locale || "uz";
  const region = await resolveSlug(
    req.payload,
    "regions" as CollectionSlug,
    doc.region,
  );
  const slug = doc.slug as string | undefined;
  return slug && region
    ? `${SITE_URL}/${loc}/destinations/${region}/${slug}`
    : `${SITE_URL}/${loc}/destinations`;
};

const Countries: CollectionConfig = {
  slug: "countries",
  labels: { singular: "Davlat", plural: "Davlatlar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "name",
    group: "Kontent",
    defaultColumns: ["name", "region", "published"],
    preview: previewCountry,
    description: "Davlat sahifalari. Yangi davlat qo'shish uchun shu yerga.",
  },
  access: {
    read: publishedOrAdmin,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "region",
          type: "relationship",
          relationTo: "regions",
          label: "Mintaqa",
          required: true,
        },
      ],
    },
    locText("name", "Nomi"),
    locArea("intro", "Tavsif", {
      description: "Davlat sahifasi tepasidagi qisqa kirish matni.",
    }),
    {
      name: "body",
      type: "textarea",
      label: "To'liq ma'lumot (Markdown)",
      localized: true,
      required: false,
      admin: {
        description:
          "Davlat haqida istalgancha to'liq ma'lumot. Markdown ishlatiladi: '# Sarlavha', '- ro'yxat', '**qalin**', '[havola](url)', '![rasm](url)'. Bo'sh qoldirsangiz faqat yuqoridagi qisqa tavsif chiqadi.",
      },
    },
    imageField("heroImage", "Asosiy rasm"),
    galleryField,
    {
      name: "published",
      type: "checkbox",
      label: "Saytda ko'rsatilsin",
      defaultValue: false,
      admin: {
        description: "Belgilanmasa, davlat saytda ko'rinmaydi (qoralama).",
      },
    },
  ],
};

const Cities: CollectionConfig = {
  slug: "cities",
  labels: { singular: "Shahar", plural: "Shaharlar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "name",
    group: "Kontent",
    defaultColumns: ["name", "country", "recommendedNights"],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "country",
          type: "relationship",
          relationTo: "countries",
          label: "Davlat",
          required: true,
        },
      ],
    },
    locText("name", "Nomi"),
    locArea("intro", "Tavsif"),
    {
      name: "recommendedNights",
      type: "number",
      label: "Tavsiya etilgan kechalar",
      required: true,
      min: 1,
    },
    {
      type: "row",
      fields: [
        {
          name: "lat",
          type: "number",
          label: "Kenglik (latitude)",
          admin: {
            description:
              "Xaritada joylashuv uchun. Google Maps'dan olishingiz mumkin (masalan Samarqand: 39.627).",
          },
        },
        {
          name: "lng",
          type: "number",
          label: "Uzunlik (longitude)",
          admin: { description: "Masalan Samarqand: 66.975." },
        },
      ],
    },
    {
      name: "attractions",
      type: "array",
      label: "Diqqatga sazovor joylar",
      localized: true,
      labels: { singular: "Joy", plural: "Joylar" },
      fields: [{ name: "text", type: "text", label: "Nomi", required: true }],
    },
    imageField("image", "Rasm"),
    galleryField,
  ],
};

const previewTour: GeneratePreviewURL = async (doc, { req, locale }) => {
  const loc = locale || "uz";
  const country = await resolveSlug(
    req.payload,
    "countries" as CollectionSlug,
    doc.country,
  );
  const slug = doc.slug as string | undefined;
  return slug && country
    ? `${SITE_URL}/${loc}/tours/${country}/${slug}`
    : `${SITE_URL}/${loc}/tours`;
};

const Tours: CollectionConfig = {
  slug: "tours",
  labels: { singular: "Tur", plural: "Turlar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "title",
    group: "Kontent",
    defaultColumns: ["title", "type", "tier", "priceFromUsd", "published"],
    preview: previewTour,
    description:
      "Barcha turlar. Yangi tur qo'shish uchun 'Create New'. O'ng yuqoridagi 'Preview' tugmasi turni saytda ko'rsatadi.",
  },
  access: {
    read: publishedOrAdmin,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "country",
          type: "relationship",
          relationTo: "countries",
          label: "Davlat",
          required: true,
        },
      ],
    },
    locText("title", "Tur nomi"),
    locArea("summary", "Qisqa tavsif", {
      description: "Katalog kartasi va tur sahifasi tepasida chiqadigan matn.",
    }),
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          label: "Turi",
          required: true,
          options: [
            { label: "Guruh turi", value: "group" },
            { label: "Individual tur", value: "private" },
            { label: "Buyurtma tur", value: "custom" },
          ],
        },
        {
          name: "tier",
          type: "select",
          label: "Daraja",
          required: true,
          defaultValue: "standard",
          options: [
            { label: "Oddiy", value: "standard" },
            { label: "Premium", value: "premium" },
          ],
          admin: {
            description: "Premium turlar alohida Premium bo'limida chiqadi.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "durationDays",
          type: "number",
          label: "Davomiyligi (kun)",
          required: true,
          min: 1,
        },
        {
          name: "priceFromUsd",
          type: "number",
          label: "Narxi (USD, dan)",
          admin: {
            description: "Premium 'so'rov bo'yicha' bo'lsa — bo'sh qoldiring.",
          },
        },
        {
          name: "singleSupplementUsd",
          type: "number",
          label: "Yakka joy qo'shimchasi (USD)",
        },
      ],
    },
    {
      name: "cities",
      type: "relationship",
      relationTo: "cities",
      label: "Shaharlar",
      hasMany: true,
    },
    {
      name: "route",
      type: "json",
      label: "Xarita marshruti",
      admin: {
        description:
          "Xaritada ko'rinadigan bekatlar (nom + koordinata). Studio'da xaritani bosib qo'shasiz.",
      },
    },
    imageField("heroImage", "Asosiy rasm"),
    galleryField,
    {
      type: "row",
      fields: [
        {
          name: "featured",
          type: "checkbox",
          label: "Bosh sahifada ko'rsatilsin",
          defaultValue: false,
        },
        {
          name: "published",
          type: "checkbox",
          label: "Saytda ko'rsatilsin",
          defaultValue: false,
          admin: {
            description: "Belgilanmasa, tur saytda ko'rinmaydi (qoralama).",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Kunma-kun dastur",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "itinerary",
          type: "array",
          label: "Kunlar",
          localized: true,
          labels: { singular: "Kun", plural: "Kunlar" },
          fields: [
            { name: "title", type: "text", label: "Kun sarlavhasi", required: true },
            {
              name: "description",
              type: "textarea",
              label: "Tavsif",
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Narxga kiradi / kirmaydi",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "included",
          type: "array",
          label: "Narxga kiradi",
          localized: true,
          labels: { singular: "Band", plural: "Bandlar" },
          fields: [{ name: "text", type: "text", label: "Matn", required: true }],
        },
        {
          name: "excluded",
          type: "array",
          label: "Narxga kirmaydi",
          localized: true,
          labels: { singular: "Band", plural: "Bandlar" },
          fields: [{ name: "text", type: "text", label: "Matn", required: true }],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Jo'nash sanalari va narxlar",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "departures",
          type: "array",
          label: "Jo'nashlar",
          labels: { singular: "Jo'nash", plural: "Jo'nashlar" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "date", type: "date", label: "Sana", required: true },
                {
                  name: "priceUsd",
                  type: "number",
                  label: "Narx (USD)",
                  required: true,
                },
                {
                  name: "status",
                  type: "select",
                  label: "Holat",
                  required: true,
                  defaultValue: "available",
                  options: [
                    { label: "Mavjud", value: "available" },
                    { label: "Kafolatlangan", value: "guaranteed" },
                    { label: "Sotilgan", value: "soldout" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Day trips — the "Events" entry in the navigation.
 *
 * Kept apart from Tours rather than added as a fourth `type`, because almost
 * nothing they carry is the same: an excursion lasts hours instead of days,
 * costs one price per person instead of a from-price with departures and a
 * single supplement, has no country, no day-by-day itinerary and no map route.
 * Folding it into Tours would have meant a form where two thirds of the fields
 * do not apply and a catalogue query that has to exclude them everywhere.
 *
 * Fields are exactly the ones agreed: name, city, hours, price per person,
 * description, photographs, what the price covers.
 */
const Excursions: CollectionConfig = {
  slug: "excursions",
  labels: { singular: "Ekskursiya", plural: "Ekskursiyalar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "title",
    group: "Kontent",
    defaultColumns: ["title", "city", "durationHours", "priceUsd", "published"],
    preview: (doc, { locale }) => {
      const loc = locale || "uz";
      const slug = doc.slug as string | undefined;
      return slug
        ? `${SITE_URL}/${loc}/excursions/${slug}`
        : `${SITE_URL}/${loc}/excursions`;
    },
    description:
      "Bir kunlik ekskursiyalar — saytdagi «Events» bo'limida chiqadi.",
  },
  access: {
    read: publishedOrAdmin,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "city",
          type: "relationship",
          relationTo: "cities",
          label: "Shahar",
          required: true,
        },
      ],
    },
    locText("title", "Nomi"),
    locArea("description", "Tavsif", {
      description:
        "Katalog kartasida va ekskursiya sahifasida chiqadigan matn.",
    }),
    {
      type: "row",
      fields: [
        {
          name: "durationHours",
          type: "number",
          label: "Davomiyligi (soat)",
          required: true,
          min: 1,
        },
        {
          name: "priceUsd",
          type: "number",
          label: "Narxi (USD, kishiga)",
          required: true,
          min: 0,
        },
      ],
    },
    imageField("heroImage", "Asosiy rasm"),
    galleryField,
    {
      name: "published",
      type: "checkbox",
      label: "Saytda ko'rsatilsin",
      defaultValue: false,
      admin: {
        description:
          "Belgilanmasa, ekskursiya saytda ko'rinmaydi (qoralama).",
      },
    },
    {
      name: "included",
      type: "array",
      label: "Narxga kiradi",
      localized: true,
      labels: { singular: "Band", plural: "Bandlar" },
      fields: [{ name: "text", type: "text", label: "Matn", required: true }],
    },
  ],
};

/**
 * Cooking master classes.
 *
 * A fourth product, not a tour and not an excursion: it runs in batches on
 * announced dates with a fixed number of seats, it carries a video, and it
 * carries what previous guests said about it. Those three things are why it is
 * its own collection — an excursion has no seat count, and nothing else on the
 * site has sessions that close when they fill.
 *
 * `heroImage` is optional here, unlike everywhere else: the copy for these
 * classes exists before the photographs do, and refusing to save a class
 * without a picture would mean the text could not be entered at all. The
 * catalogue card falls back to a plain panel, and a class stays a draft until
 * somebody publishes it.
 */
const Masterclasses: CollectionConfig = {
  slug: "masterclasses",
  labels: { singular: "Masterklass", plural: "Masterklasslar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "title",
    group: "Kontent",
    defaultColumns: ["title", "city", "durationHours", "priceUsd", "published"],
    preview: (doc, { locale }) => {
      const loc = locale || "uz";
      const slug = doc.slug as string | undefined;
      return slug
        ? `${SITE_URL}/${loc}/masterclasses/${slug}`
        : `${SITE_URL}/${loc}/masterclasses`;
    },
    description:
      "Oshpazlik masterklasslari — sanalar (patoklar), video va mijoz fikrlari bilan.",
  },
  access: {
    read: publishedOrAdmin,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "city",
          type: "relationship",
          relationTo: "cities",
          label: "Shahar",
          required: true,
        },
      ],
    },
    locText("title", "Nomi"),
    locText("tagline", "Qisqa shior", {
      required: false,
      description:
        "Sarlavha ostidagi bir qatorlik ta'rif. Masalan: «Eng fotogenik — nafis buklash san'ati».",
    }),
    locArea("summary", "Qisqa tavsif", {
      description: "Katalog kartasida chiqadigan 1–2 gap.",
    }),
    locArea("description", "To'liq tavsif", {
      description:
        "Masterklass sahifasidagi asosiy matn. Yangi qatorlar saqlanadi.",
    }),
    {
      type: "row",
      fields: [
        {
          name: "durationHours",
          type: "number",
          label: "Davomiyligi (soat)",
          required: true,
          min: 1,
        },
        {
          name: "priceUsd",
          type: "number",
          label: "Narxi (USD, kishiga)",
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: "youtubeUrl",
      type: "text",
      label: "YouTube havolasi",
      admin: {
        description:
          "Video havolasini shu yerga qo'ying — sahifada o'ynatgich bo'lib chiqadi. Bo'sh qolsa video ko'rsatilmaydi.",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      label: "Asosiy rasm",
      admin: { description: REPLACE_HELP },
    },
    galleryField,
    {
      name: "published",
      type: "checkbox",
      label: "Saytda ko'rsatilsin",
      defaultValue: false,
      admin: {
        description: "Belgilanmasa, masterklass saytda ko'rinmaydi (qoralama).",
      },
    },
    {
      name: "included",
      type: "array",
      label: "Narxga kiradi",
      localized: true,
      labels: { singular: "Band", plural: "Bandlar" },
      fields: [{ name: "text", type: "text", label: "Matn", required: true }],
    },
    {
      type: "collapsible",
      label: "Patoklar (sanalar va joylar)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "sessions",
          type: "array",
          label: "Patoklar",
          labels: { singular: "Patok", plural: "Patoklar" },
          admin: {
            description:
              "Saytda eng yaqin, hali to'lmagan patok ko'rinadi. Patok to'lganda keyingisi avtomatik chiqadi.",
          },
          fields: [
            {
              type: "row",
              fields: [
                { name: "date", type: "date", label: "Sana", required: true },
                {
                  name: "capacity",
                  type: "number",
                  label: "Joylar soni",
                  required: true,
                  min: 1,
                },
                {
                  name: "booked",
                  type: "number",
                  label: "Band qilingan",
                  required: true,
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    description:
                      "To'lovni tasdiqlaganingizda qo'lda oshiring — sayt qolgan joylarni shu raqamdan hisoblaydi.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Mijozlar fikrlari",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "reviews",
          type: "array",
          label: "Fikrlar",
          localized: true,
          labels: { singular: "Fikr", plural: "Fikrlar" },
          fields: [
            {
              name: "author",
              type: "text",
              label: "Kim aytgan",
              required: true,
            },
            { name: "text", type: "textarea", label: "Fikr", required: true },
          ],
        },
      ],
    },
  ],
};

/**
 * Who sends us guests, and what they are owed for it.
 *
 * The first stage is hotels: a QR code at reception opens the master class
 * catalogue, and the booking that follows has to be traceable back to the
 * hotel so the cashback can be paid. Stage two is OTAs and stage three is tour
 * operators — different ways of arriving, same question at the end of the
 * month, so all three are one collection distinguished by `type`.
 *
 * Nothing here is localized. A hotel's name is a proper noun and the cashback
 * is a number.
 */
const Partners: CollectionConfig = {
  slug: "partners",
  labels: { singular: "Hamkor", plural: "Hamkorlar" },
  hooks: {
    /**
     * Deleting a partner used to answer 500.
     *
     * Two foreign keys point at it. `partner_visits.partner_id` is NOT NULL
     * and declared ON DELETE SET NULL, which is a contradiction SQLite
     * resolves by refusing — so a single scan made a partner undeletable with
     * no explanation. Scans mean nothing without the partner they counted, so
     * they go with it.
     *
     * Enquiries are different: they are what the cashback was calculated from.
     * A partner with any is refused, and told why — the answer there is to
     * switch it off, not to erase the month it earned.
     */
    beforeDelete: [
      async ({ req, id }) => {
        const leads = await req.payload.count({
          collection: "leads",
          where: { partner: { equals: id } },
        });
        if (leads.totalDocs > 0) {
          throw new APIError(
            `Bu hamkordan ${leads.totalDocs} ta so'rov kelgan — o'chirib bo'lmaydi, ` +
              "chunki cashback hisobi shularga tayanadi. O'rniga «Faol» katagini olib tashlang: " +
              "QR kod ishlamay qoladi, tarix esa saqlanadi.",
            400,
          );
        }
        await req.payload.delete({
          collection: "partner-visits",
          where: { partner: { equals: id } },
          overrideAccess: true,
        });
      },
    ],
  },
  admin: {
    useAsTitle: "name",
    group: "Mijozlar",
    defaultColumns: ["name", "code", "type", "commissionUsd", "active"],
    description:
      "Mijoz olib keladigan hamkorlar. Har biriga QR kod beriladi va olib kelgan mijozlari hisoblanadi.",
  },
  access: {
    // Deliberately not public. A partner list is a commercial relationship
    // and a cashback rate; /api/partners must not answer an anonymous caller.
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", label: "Nomi", required: true },
        {
          name: "code",
          type: "text",
          label: "Kod",
          required: true,
          unique: true,
          index: true,
          admin: {
            description:
              "QR havolasidagi qism: tripsfactory.com/r/<kod>. Faqat kichik lotin harflar va defis.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          label: "Turi",
          required: true,
          defaultValue: "hotel",
          options: [
            { label: "Mehmonxona", value: "hotel" },
            { label: "OTA (onlayn platforma)", value: "ota" },
            { label: "Turoperator", value: "tour_operator" },
            { label: "Boshqa", value: "other" },
          ],
        },
        {
          name: "commissionUsd",
          type: "number",
          label: "Cashback (USD, kishiga)",
          required: true,
          defaultValue: 15,
          min: 0,
          admin: {
            description:
              "Har bir kelgan va to'lagan mijoz uchun. Kelishuvga qarab hamkorlar bo'yicha farq qilishi mumkin.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "contactName", type: "text", label: "Aloqa uchun shaxs" },
        { name: "contactPhone", type: "text", label: "Telefon" },
        { name: "contactEmail", type: "email", label: "Email" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "active",
          type: "checkbox",
          label: "Faol",
          defaultValue: true,
          admin: {
            description:
              "Belgilanmasa QR kod ishlamaydi — mijoz oddiy sahifaga tushadi va hamkorga yozilmaydi.",
          },
        },
        {
          /**
           * Whether a real partner is behind this code yet.
           *
           * Banners are printed in batches of thirty or forty, long before
           * that many hotels have signed. So a code identifies the *banner*,
           * not the hotel: it is printed, it works from the day it is printed,
           * and the hotel is attached to it when the contract is signed. A
           * code in stock still counts its scans, which is what makes it safe
           * to hand a banner over before anybody has updated the Studio.
           */
          name: "assigned",
          type: "checkbox",
          label: "Mehmonxonaga biriktirilgan",
          defaultValue: true,
          admin: {
            description:
              "Chop etilgan, lekin hali hech kimga berilmagan QR kodlar uchun belgilanmaydi.",
          },
        },
      ],
    },
    { name: "notes", type: "textarea", label: "Izoh" },
  ],
};

/**
 * One QR scan.
 *
 * A row rather than a counter on the partner, because the question is never
 * "how many ever" — it is "how many last month, and how many of those booked".
 * A counter cannot answer that.
 *
 * Written by /r/[code] on the public site, so `create` has to be reachable
 * without a session; it is called with overrideAccess from the route and
 * nothing else may touch it.
 */
const PartnerVisits: CollectionConfig = {
  slug: "partner-visits",
  labels: { singular: "QR skani", plural: "QR skanlari" },
  admin: {
    useAsTitle: "id",
    group: "Mijozlar",
    defaultColumns: ["partner", "locale", "createdAt"],
    hidden: true,
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "partner",
      type: "relationship",
      relationTo: "partners",
      label: "Hamkor",
      required: true,
      index: true,
    },
    { name: "locale", type: "text", label: "Til" },
  ],
};

const previewGuide: GeneratePreviewURL = (doc, { locale }) => {
  const loc = locale || "uz";
  const slug = doc.slug as string | undefined;
  return slug ? `${SITE_URL}/${loc}/guide/${slug}` : `${SITE_URL}/${loc}/guide`;
};

const Guides: CollectionConfig = {
  slug: "guides",
  labels: { singular: "Qo'llanma", plural: "Qo'llanmalar" },
  hooks: revalidateHooks,
  admin: {
    useAsTitle: "title",
    group: "Kontent",
    preview: previewGuide,
    description: "Viza, mavsum, taomlar kabi foydali maqolalar.",
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        slugField,
        {
          name: "country",
          type: "relationship",
          relationTo: "countries",
          label: "Davlat",
          required: true,
        },
      ],
    },
    locText("title", "Sarlavha"),
    {
      name: "sections",
      type: "array",
      label: "Bo'limlar",
      localized: true,
      labels: { singular: "Bo'lim", plural: "Bo'limlar" },
      fields: [
        { name: "heading", type: "text", label: "Sarlavha", required: true },
        { name: "body", type: "textarea", label: "Matn", required: true },
      ],
    },
  ],
};

const Leads: CollectionConfig = {
  slug: "leads",
  labels: { singular: "So'rov", plural: "So'rovlar" },
  admin: {
    useAsTitle: "name",
    group: "So'rovlar",
    defaultColumns: ["name", "email", "tourSlug", "status", "createdAt"],
    description: "Saytdan kelgan mijoz so'rovlari.",
  },
  // Created via the site's API route (server-side), managed by admins
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: "name", type: "text", label: "Ism", required: true },
    { name: "email", type: "email", label: "Email", required: true },
    { name: "phone", type: "text", label: "Telefon" },
    { name: "tourSlug", type: "text", label: "Tur" },
    {
      // Which catalogue the slug above belongs to. Without it a lead reading
      // "manti-master-class" is indistinguishable from a tour enquiry, and the
      // Studio had no way to say what was actually requested.
      name: "kind",
      type: "select",
      label: "Turi",
      defaultValue: "tour",
      options: [
        { label: "Tur", value: "tour" },
        { label: "Ekskursiya", value: "excursion" },
        { label: "Masterklass", value: "masterclass" },
      ],
    },
    {
      // Who sent this guest. Set from the QR cookie when the enquiry arrives,
      // and the only reason the cashback figure at the end of the month can be
      // checked against anything.
      name: "partner",
      type: "relationship",
      relationTo: "partners",
      label: "Kim olib kelgan",
      index: true,
    },
    { name: "date", type: "text", label: "Sana" },
    { name: "pax", type: "number", label: "Kishilar soni" },
    { name: "message", type: "textarea", label: "Xabar" },
    { name: "locale", type: "text", label: "Til" },
    {
      name: "paidAt",
      type: "date",
      label: "To'lov tasdiqlangan vaqt",
      admin: { readOnly: true },
    },
    {
      name: "status",
      type: "select",
      label: "Holat",
      defaultValue: "new",
      options: [
        { label: "Yangi", value: "new" },
        { label: "Bog'lanildi", value: "contacted" },
        { label: "To'landi", value: "paid" },
        { label: "Yopildi", value: "closed" },
      ],
    },
  ],
};

const heroGroup = (name: string, label: string): Field => ({
  name,
  type: "group",
  label,
  fields: [
    imageField("image", "Rasm"),
    locText("title", "Sarlavha"),
    locArea("subtitle", "Tagsarlavha"),
  ],
});

/**
 * This secret signs admin session tokens. It used to fall back to a literal
 * committed to this repository, which meant a misconfigured environment booted
 * happily with a secret the whole world could read — and forge sessions with.
 * Refusing to start is the only safe answer: a build that fails is visible, a
 * forgeable admin is not.
 */
const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) {
  throw new Error(
    "PAYLOAD_SECRET is not set. Refusing to start — it signs admin sessions " +
      "and there is no safe default. Set it in .env locally and in the Vercel " +
      "project settings.",
  );
}

export default buildConfig({
  secret: payloadSecret,
  editor: lexicalEditor(),
  admin: {
    theme: "light",
    meta: {
      titleSuffix: "— TripsFactory",
    },
    components: {
      graphics: {
        Logo: "/components/admin/Logo#default",
        Icon: "/components/admin/Icon#default",
      },
      beforeDashboard: ["/components/admin/Dashboard#default"],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: [
      { code: "en", label: "English" },
      { code: "uz", label: "O'zbekcha" },
      { code: "ru", label: "Русский" },
      { code: "ja", label: "日本語" },
      { code: "zh", label: "中文" },
      { code: "es", label: "Español" },
      { code: "it", label: "Italiano" },
      { code: "de", label: "Deutsch" },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Regions,
    Countries,
    Cities,
    Tours,
    Excursions,
    Masterclasses,
    Guides,
    Leads,
    Partners,
    PartnerVisits,
  ],
  globals: [
    {
      slug: "site-content",
      label: "Bosh sahifa",
      hooks: { afterChange: [() => revalidateSite()] },
      admin: {
        group: "Kontent",
        description:
          "Bosh sahifa va Premium bo'lim uchun asosiy (hero) rasm va matnlar.",
        preview: (_doc, { locale }) => `${SITE_URL}/${locale || "uz"}`,
      },
      access: { read: publicRead, update: adminOnly },
      fields: [
        heroGroup("hero", "Bosh sahifa hero"),
        heroGroup("premiumHero", "Premium hero"),
        {
          /**
           * What the booking emails need and the site cannot know.
           *
           * The payment link is whatever the operator can actually take money
           * with today — a bank invoice, a Payme link, later an acquirer's
           * checkout. Left empty, the request email says the details are
           * coming instead of showing an empty button.
           */
          name: "booking",
          type: "group",
          label: "Bron va to'lov",
          fields: [
            {
              name: "paymentUrl",
              type: "text",
              label: "To'lov havolasi",
              admin: {
                description:
                  "Mijozga yuboriladigan to'lov sahifasi. Bo'sh qolsa xatda «to'lov ma'lumotlarini tez orada yuboramiz» deb yoziladi.",
              },
            },
            {
              name: "venue",
              type: "text",
              label: "Masterklass manzili",
              admin: {
                description:
                  "To'lov tasdiqlangach yuboriladigan xatda ko'rsatiladi. Masalan: Toshkent, Amir Temur ko'chasi 15.",
              },
            },
          ],
        },
      ],
    },
  ],
  /**
   * Hyperdrive first — on Workers it is how Neon is reached, with connections
   * pooled across the edge instead of opened per invocation. DATABASE_URL
   * second: it covers the build step, where bindings are not always wired up,
   * and it is what the Vercel deployment still runs on. sqlite last, for local
   * development.
   */
  db: cf?.env.D1
    ? sqliteD1Adapter({ binding: cf.env.D1 })
    : localDb(),
  /**
   * Same ordering, same reason. The R2 binding needs no credentials — the API
   * token exists only to move the existing files off Vercel Blob once.
   */
  plugins: cf?.env.R2
    ? [r2Storage({ bucket: cf.env.R2, collections: { media: true } })]
    : process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: { media: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : [],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
