import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`tours\` ADD \`variant_key\` text;`)
  await db.run(sql`CREATE INDEX \`tours_variant_key_idx\` ON \`tours\` (\`variant_key\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`tours_variant_key_idx\`;`)
  await db.run(sql`ALTER TABLE \`tours\` DROP COLUMN \`variant_key\`;`)
}
