import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import type { Access, CollectionConfig, Field } from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** Public site reads everything published; writing requires an admin login. */
const publicRead: Access = () => true;
const adminOnly: Access = ({ req }) => Boolean(req.user);

const localizedText = (name: string, required = true): Field => ({
  name,
  type: "text",
  required,
  localized: true,
});

const localizedTextarea = (name: string, required = true): Field => ({
  name,
  type: "textarea",
  required,
  localized: true,
});

const slugField: Field = {
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: { description: "URL identifier — lowercase, hyphens only" },
};

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [],
};

const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: path.resolve(dirname, "../media"),
    mimeTypes: ["image/*"],
  },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [{ name: "alt", type: "text", required: true }],
};

const Regions: CollectionConfig = {
  slug: "regions",
  admin: { useAsTitle: "name" },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [slugField, localizedText("name")],
};

const Countries: CollectionConfig = {
  slug: "countries",
  admin: { useAsTitle: "name" },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    slugField,
    { name: "region", type: "relationship", relationTo: "regions", required: true },
    localizedText("name"),
    localizedTextarea("intro"),
    { name: "heroImage", type: "upload", relationTo: "media", required: true },
    { name: "published", type: "checkbox", defaultValue: false },
  ],
};

const Cities: CollectionConfig = {
  slug: "cities",
  admin: { useAsTitle: "name" },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    slugField,
    { name: "country", type: "relationship", relationTo: "countries", required: true },
    localizedText("name"),
    localizedTextarea("intro"),
    { name: "recommendedNights", type: "number", required: true, min: 1 },
    {
      name: "attractions",
      type: "array",
      localized: true,
      fields: [{ name: "text", type: "text", required: true }],
    },
    { name: "image", type: "upload", relationTo: "media", required: true },
  ],
};

const Tours: CollectionConfig = {
  slug: "tours",
  admin: { useAsTitle: "title", defaultColumns: ["title", "type", "tier", "priceFromUsd"] },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    slugField,
    { name: "country", type: "relationship", relationTo: "countries", required: true },
    localizedText("title"),
    localizedTextarea("summary"),
    {
      name: "type",
      type: "select",
      required: true,
      options: ["group", "private", "custom"],
    },
    {
      name: "tier",
      type: "select",
      required: true,
      defaultValue: "standard",
      options: ["standard", "premium"],
    },
    { name: "durationDays", type: "number", required: true, min: 1 },
    { name: "cities", type: "relationship", relationTo: "cities", hasMany: true },
    {
      name: "priceFromUsd",
      type: "number",
      admin: { description: "Leave empty for premium 'price on request'" },
    },
    { name: "singleSupplementUsd", type: "number" },
    {
      name: "departures",
      type: "array",
      fields: [
        { name: "date", type: "date", required: true },
        { name: "priceUsd", type: "number", required: true },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "available",
          options: ["available", "guaranteed", "soldout"],
        },
      ],
    },
    {
      name: "itinerary",
      type: "array",
      localized: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea", required: true },
      ],
    },
    {
      name: "included",
      type: "array",
      localized: true,
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "excluded",
      type: "array",
      localized: true,
      fields: [{ name: "text", type: "text", required: true }],
    },
    { name: "heroImage", type: "upload", relationTo: "media", required: true },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "published", type: "checkbox", defaultValue: false },
  ],
};

const Guides: CollectionConfig = {
  slug: "guides",
  admin: { useAsTitle: "title" },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    slugField,
    { name: "country", type: "relationship", relationTo: "countries", required: true },
    localizedText("title"),
    {
      name: "sections",
      type: "array",
      localized: true,
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "body", type: "textarea", required: true },
      ],
    },
  ],
};

const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "tourSlug", "status", "createdAt"],
  },
  // Created via the site's API route (server-side), managed by admins
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "tourSlug", type: "text" },
    { name: "date", type: "text" },
    { name: "pax", type: "number" },
    { name: "message", type: "textarea" },
    { name: "locale", type: "text" },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: ["new", "contacted", "closed"],
    },
  ],
};

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? "dev-secret-change-me",
  editor: lexicalEditor(),
  localization: {
    locales: ["en", "uz", "ru", "ja", "zh", "es", "it", "de"],
    defaultLocale: "en",
    fallback: true,
  },
  collections: [Users, Media, Regions, Countries, Cities, Tours, Guides, Leads],
  globals: [
    {
      slug: "site-content",
      access: { read: publicRead, update: adminOnly },
      fields: [
        {
          name: "hero",
          type: "group",
          fields: [
            { name: "image", type: "upload", relationTo: "media", required: true },
            localizedText("title"),
            localizedTextarea("subtitle"),
          ],
        },
        {
          name: "premiumHero",
          type: "group",
          fields: [
            { name: "image", type: "upload", relationTo: "media", required: true },
            localizedText("title"),
            localizedTextarea("subtitle"),
          ],
        },
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
