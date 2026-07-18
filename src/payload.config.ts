import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
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

/** Public site reads everything published; writing requires an admin login. */
const publicRead: Access = () => true;
const adminOnly: Access = ({ req }) => Boolean(req.user);

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
  auth: true,
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
  admin: {
    useAsTitle: "name",
    group: "Kontent",
    defaultColumns: ["name", "region", "published"],
    preview: previewCountry,
    description: "Davlat sahifalari. Yangi davlat qo'shish uchun shu yerga.",
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
  admin: {
    useAsTitle: "title",
    group: "Kontent",
    defaultColumns: ["title", "type", "tier", "priceFromUsd", "published"],
    preview: previewTour,
    description:
      "Barcha turlar. Yangi tur qo'shish uchun 'Create New'. O'ng yuqoridagi 'Preview' tugmasi turni saytda ko'rsatadi.",
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

const previewGuide: GeneratePreviewURL = (doc, { locale }) => {
  const loc = locale || "uz";
  const slug = doc.slug as string | undefined;
  return slug ? `${SITE_URL}/${loc}/guide/${slug}` : `${SITE_URL}/${loc}/guide`;
};

const Guides: CollectionConfig = {
  slug: "guides",
  labels: { singular: "Qo'llanma", plural: "Qo'llanmalar" },
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
    { name: "date", type: "text", label: "Sana" },
    { name: "pax", type: "number", label: "Kishilar soni" },
    { name: "message", type: "textarea", label: "Xabar" },
    { name: "locale", type: "text", label: "Til" },
    {
      name: "status",
      type: "select",
      label: "Holat",
      defaultValue: "new",
      options: [
        { label: "Yangi", value: "new" },
        { label: "Bog'lanildi", value: "contacted" },
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

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? "dev-secret-change-me",
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
  collections: [Users, Media, Regions, Countries, Cities, Tours, Guides, Leads],
  globals: [
    {
      slug: "site-content",
      label: "Bosh sahifa",
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
      ],
    },
  ],
  db: process.env.DATABASE_URL
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
    : sqliteAdapter({ client: { url: "file:./payload.db" } }),
  plugins: process.env.BLOB_READ_WRITE_TOKEN
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
