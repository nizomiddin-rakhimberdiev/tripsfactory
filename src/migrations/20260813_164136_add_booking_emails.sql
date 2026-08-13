-- Booking emails — the D1 half of 20260813_164136_add_booking_emails.ts.
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260813_164136_add_booking_emails.sql
--
-- Three nullable columns. The `paid` status needs no migration: Payload stores
-- a select as text, so the new option is a value the column already accepts.

ALTER TABLE `leads` ADD `paid_at` text;
ALTER TABLE `site_content` ADD `booking_payment_url` text;
ALTER TABLE `site_content` ADD `booking_venue` text;

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260813_164136_add_booking_emails', 5);
