import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`leads\` ADD \`paid_at\` text;`)
  await db.run(sql`ALTER TABLE \`site_content\` ADD \`booking_payment_url\` text;`)
  await db.run(sql`ALTER TABLE \`site_content\` ADD \`booking_venue\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`paid_at\`;`)
  await db.run(sql`ALTER TABLE \`site_content\` DROP COLUMN \`booking_payment_url\`;`)
  await db.run(sql`ALTER TABLE \`site_content\` DROP COLUMN \`booking_venue\`;`)
}
