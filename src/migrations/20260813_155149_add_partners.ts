import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`partners\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`code\` text NOT NULL,
  	\`type\` text DEFAULT 'hotel' NOT NULL,
  	\`commission_usd\` numeric DEFAULT 15 NOT NULL,
  	\`contact_name\` text,
  	\`contact_phone\` text,
  	\`contact_email\` text,
  	\`active\` integer DEFAULT true,
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`partners_code_idx\` ON \`partners\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`partners_updated_at_idx\` ON \`partners\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partners_created_at_idx\` ON \`partners\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`partner_visits\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`partner_id\` integer NOT NULL,
  	\`locale\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`partner_id\`) REFERENCES \`partners\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`partner_visits_partner_idx\` ON \`partner_visits\` (\`partner_id\`);`)
  await db.run(sql`CREATE INDEX \`partner_visits_updated_at_idx\` ON \`partner_visits\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partner_visits_created_at_idx\` ON \`partner_visits\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`partner_id\` integer REFERENCES partners(id);`)
  await db.run(sql`CREATE INDEX \`leads_partner_idx\` ON \`leads\` (\`partner_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`partners_id\` integer REFERENCES partners(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`partner_visits_id\` integer REFERENCES partner_visits(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partners_id_idx\` ON \`payload_locked_documents_rels\` (\`partners_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partner_visits_id_idx\` ON \`payload_locked_documents_rels\` (\`partner_visits_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`partners\`;`)
  await db.run(sql`DROP TABLE \`partner_visits\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_leads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`tour_slug\` text,
  	\`kind\` text DEFAULT 'tour',
  	\`date\` text,
  	\`pax\` numeric,
  	\`message\` text,
  	\`locale\` text,
  	\`status\` text DEFAULT 'new',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_leads\`("id", "name", "email", "phone", "tour_slug", "kind", "date", "pax", "message", "locale", "status", "updated_at", "created_at") SELECT "id", "name", "email", "phone", "tour_slug", "kind", "date", "pax", "message", "locale", "status", "updated_at", "created_at" FROM \`leads\`;`)
  await db.run(sql`DROP TABLE \`leads\`;`)
  await db.run(sql`ALTER TABLE \`__new_leads\` RENAME TO \`leads\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`leads_updated_at_idx\` ON \`leads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leads_created_at_idx\` ON \`leads\` (\`created_at\`);`)
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
  	\`excursions_id\` integer,
  	\`masterclasses_id\` integer,
  	\`guides_id\` integer,
  	\`leads_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`regions_id\`) REFERENCES \`regions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`countries_id\`) REFERENCES \`countries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tours_id\`) REFERENCES \`tours\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`excursions_id\`) REFERENCES \`excursions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`masterclasses_id\`) REFERENCES \`masterclasses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`guides_id\`) REFERENCES \`guides\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "regions_id", "countries_id", "cities_id", "tours_id", "excursions_id", "masterclasses_id", "guides_id", "leads_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "regions_id", "countries_id", "cities_id", "tours_id", "excursions_id", "masterclasses_id", "guides_id", "leads_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_regions_id_idx\` ON \`payload_locked_documents_rels\` (\`regions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_countries_id_idx\` ON \`payload_locked_documents_rels\` (\`countries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_tours_id_idx\` ON \`payload_locked_documents_rels\` (\`tours_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_excursions_id_idx\` ON \`payload_locked_documents_rels\` (\`excursions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_masterclasses_id_idx\` ON \`payload_locked_documents_rels\` (\`masterclasses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_guides_id_idx\` ON \`payload_locked_documents_rels\` (\`guides_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
}
