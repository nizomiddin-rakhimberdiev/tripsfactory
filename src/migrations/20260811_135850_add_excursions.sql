-- Excursions — the D1 half of 20260811_135850_add_excursions.ts.
--
-- Payload's migration runner is not used against the production database: the
-- Worker gets its D1 binding at request time, not from a CLI. So the same
-- statements are applied with
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260811_135850_add_excursions.sql
--
-- Purely additive — three new tables, one new nullable column on an existing
-- one — so it can be applied before the Worker that uses them is deployed.
-- The final INSERT records it in payload_migrations so the two databases agree
-- on what has run.

CREATE TABLE `excursions_included` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_locale` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `excursions`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `excursions_included_order_idx` ON `excursions_included` (`_order`);
CREATE INDEX `excursions_included_parent_id_idx` ON `excursions_included` (`_parent_id`);
CREATE INDEX `excursions_included_locale_idx` ON `excursions_included` (`_locale`);

CREATE TABLE `excursions` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`city_id` integer NOT NULL,
	`duration_hours` numeric NOT NULL,
	`price_usd` numeric NOT NULL,
	`hero_image_id` integer NOT NULL,
	`gallery` text,
	`published` integer DEFAULT false,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`hero_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX `excursions_slug_idx` ON `excursions` (`slug`);
CREATE INDEX `excursions_city_idx` ON `excursions` (`city_id`);
CREATE INDEX `excursions_hero_image_idx` ON `excursions` (`hero_image_id`);
CREATE INDEX `excursions_updated_at_idx` ON `excursions` (`updated_at`);
CREATE INDEX `excursions_created_at_idx` ON `excursions` (`created_at`);

CREATE TABLE `excursions_locales` (
	`title` text NOT NULL,
	`description` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `excursions`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `excursions_locales_locale_parent_id_unique` ON `excursions_locales` (`_locale`,`_parent_id`);

ALTER TABLE `payload_locked_documents_rels` ADD `excursions_id` integer REFERENCES excursions(id);
CREATE INDEX `payload_locked_documents_rels_excursions_id_idx` ON `payload_locked_documents_rels` (`excursions_id`);

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260811_135850_add_excursions', 2);
