import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`tours_good_to_know\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tours_good_to_know_order_idx\` ON \`tours_good_to_know\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tours_good_to_know_parent_id_idx\` ON \`tours_good_to_know\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`tours_good_to_know_locale_idx\` ON \`tours_good_to_know\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`tours_price_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`pax\` numeric NOT NULL,
  	\`price_usd\` numeric NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`tours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`tours_price_tiers_order_idx\` ON \`tours_price_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`tours_price_tiers_parent_id_idx\` ON \`tours_price_tiers\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`tours_good_to_know\`;`)
  await db.run(sql`DROP TABLE \`tours_price_tiers\`;`)
}
