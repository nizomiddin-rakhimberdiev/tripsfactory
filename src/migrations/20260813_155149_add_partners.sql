-- Partners and QR scans — the D1 half of 20260813_155149_add_partners.ts.
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260813_155149_add_partners.sql
--
-- Additive: two new tables, one nullable column on `leads`, two on
-- payload_locked_documents_rels. Existing leads keep a null partner, which is
-- what they are — everything booked so far came in without a referral.

CREATE TABLE `partners` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`type` text DEFAULT 'hotel' NOT NULL,
	`commission_usd` numeric DEFAULT 15 NOT NULL,
	`contact_name` text,
	`contact_phone` text,
	`contact_email` text,
	`active` integer DEFAULT true,
	`notes` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE UNIQUE INDEX `partners_code_idx` ON `partners` (`code`);
CREATE INDEX `partners_updated_at_idx` ON `partners` (`updated_at`);
CREATE INDEX `partners_created_at_idx` ON `partners` (`created_at`);

CREATE TABLE `partner_visits` (
	`id` integer PRIMARY KEY NOT NULL,
	`partner_id` integer NOT NULL,
	`locale` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `partner_visits_partner_idx` ON `partner_visits` (`partner_id`);
CREATE INDEX `partner_visits_updated_at_idx` ON `partner_visits` (`updated_at`);
CREATE INDEX `partner_visits_created_at_idx` ON `partner_visits` (`created_at`);

ALTER TABLE `leads` ADD `partner_id` integer REFERENCES partners(id);
CREATE INDEX `leads_partner_idx` ON `leads` (`partner_id`);

ALTER TABLE `payload_locked_documents_rels` ADD `partners_id` integer REFERENCES partners(id);
ALTER TABLE `payload_locked_documents_rels` ADD `partner_visits_id` integer REFERENCES partner_visits(id);
CREATE INDEX `payload_locked_documents_rels_partners_id_idx` ON `payload_locked_documents_rels` (`partners_id`);
CREATE INDEX `payload_locked_documents_rels_partner_visits_id_idx` ON `payload_locked_documents_rels` (`partner_visits_id`);

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260813_155149_add_partners', 4);
