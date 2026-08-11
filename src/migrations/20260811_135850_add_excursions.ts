import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`excursions_included\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`excursions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`excursions_included_order_idx\` ON \`excursions_included\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`excursions_included_parent_id_idx\` ON \`excursions_included\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`excursions_included_locale_idx\` ON \`excursions_included\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`excursions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`city_id\` integer NOT NULL,
  	\`duration_hours\` numeric NOT NULL,
  	\`price_usd\` numeric NOT NULL,
  	\`hero_image_id\` integer NOT NULL,
  	\`gallery\` text,
  	\`published\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`city_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`excursions_slug_idx\` ON \`excursions\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`excursions_city_idx\` ON \`excursions\` (\`city_id\`);`)
  await db.run(sql`CREATE INDEX \`excursions_hero_image_idx\` ON \`excursions\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`excursions_updated_at_idx\` ON \`excursions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`excursions_created_at_idx\` ON \`excursions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`excursions_locales\` (
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`excursions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`excursions_locales_locale_parent_id_unique\` ON \`excursions_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`excursions_id\` integer REFERENCES excursions(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_excursions_id_idx\` ON \`payload_locked_documents_rels\` (\`excursions_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`excursions_included\`;`)
  await db.run(sql`DROP TABLE \`excursions\`;`)
  await db.run(sql`DROP TABLE \`excursions_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`regions_id\` integer,
  	\`countries_id\` integer,
  	\`cities_id\` integer,
  	\`tours_id\` integer,
  	\`guides_id\` integer,
  	\`leads_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`regions_id\`) REFERENCES \`regions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`countries_id\`) REFERENCES \`countries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tours_id\`) REFERENCES \`tours\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`guides_id\`) REFERENCES \`guides\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "regions_id", "countries_id", "cities_id", "tours_id", "guides_id", "leads_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "regions_id", "countries_id", "cities_id", "tours_id", "guides_id", "leads_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_regions_id_idx\` ON \`payload_locked_documents_rels\` (\`regions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_countries_id_idx\` ON \`payload_locked_documents_rels\` (\`countries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tours_id_idx\` ON \`payload_locked_documents_rels\` (\`tours_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_guides_id_idx\` ON \`payload_locked_documents_rels\` (\`guides_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
}
