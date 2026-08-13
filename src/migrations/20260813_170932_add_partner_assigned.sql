-- Stock vs assigned QR codes — the D1 half of 20260813_170932_add_partner_assigned.ts.
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260813_170932_add_partner_assigned.sql
--
-- One nullable column, defaulting to true: every partner that exists today was
-- created for a named hotel, which is exactly what "assigned" means.

ALTER TABLE `partners` ADD `assigned` integer DEFAULT true;

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260813_170932_add_partner_assigned', 6);
