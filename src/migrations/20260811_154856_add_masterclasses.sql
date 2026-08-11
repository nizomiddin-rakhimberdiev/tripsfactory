-- Master classes — the D1 half of 20260811_154856_add_masterclasses.ts.
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260811_154856_add_masterclasses.sql
--
-- Additive: five new tables, one new nullable column on `leads`, one on
-- payload_locked_documents_rels. Existing rows are not touched — `leads.kind`
-- defaults to 'tour', which is what every lead recorded so far actually was.

CREATE TABLE `masterclasses_included` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_locale` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `masterclasses`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `masterclasses_included_order_idx` ON `masterclasses_included` (`_order`);
CREATE INDEX `masterclasses_included_parent_id_idx` ON `masterclasses_included` (`_parent_id`);
CREATE INDEX `masterclasses_included_locale_idx` ON `masterclasses_included` (`_locale`);

CREATE TABLE `masterclasses_sessions` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`capacity` numeric NOT NULL,
	`booked` numeric DEFAULT 0 NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `masterclasses`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `masterclasses_sessions_order_idx` ON `masterclasses_sessions` (`_order`);
CREATE INDEX `masterclasses_sessions_parent_id_idx` ON `masterclasses_sessions` (`_parent_id`);

CREATE TABLE `masterclasses_reviews` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_locale` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `masterclasses`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `masterclasses_reviews_order_idx` ON `masterclasses_reviews` (`_order`);
CREATE INDEX `masterclasses_reviews_parent_id_idx` ON `masterclasses_reviews` (`_parent_id`);
CREATE INDEX `masterclasses_reviews_locale_idx` ON `masterclasses_reviews` (`_locale`);

CREATE TABLE `masterclasses` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`city_id` integer NOT NULL,
	`duration_hours` numeric NOT NULL,
	`price_usd` numeric NOT NULL,
	`youtube_url` text,
	`hero_image_id` integer,
	`gallery` text,
	`published` integer DEFAULT false,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`hero_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX `masterclasses_slug_idx` ON `masterclasses` (`slug`);
CREATE INDEX `masterclasses_city_idx` ON `masterclasses` (`city_id`);
CREATE INDEX `masterclasses_hero_image_idx` ON `masterclasses` (`hero_image_id`);
CREATE INDEX `masterclasses_updated_at_idx` ON `masterclasses` (`updated_at`);
CREATE INDEX `masterclasses_created_at_idx` ON `masterclasses` (`created_at`);

CREATE TABLE `masterclasses_locales` (
	`title` text NOT NULL,
	`tagline` text,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `masterclasses`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `masterclasses_locales_locale_parent_id_unique` ON `masterclasses_locales` (`_locale`,`_parent_id`);

ALTER TABLE `leads` ADD `kind` text DEFAULT 'tour';
ALTER TABLE `payload_locked_documents_rels` ADD `masterclasses_id` integer REFERENCES masterclasses(id);
CREATE INDEX `payload_locked_documents_rels_masterclasses_id_idx` ON `payload_locked_documents_rels` (`masterclasses_id`);

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260811_154856_add_masterclasses', 3);
