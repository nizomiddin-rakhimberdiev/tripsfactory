-- Tour variants — the D1 half of 20260817_170757_add_tour_variant_key.ts.
--
--   npx wrangler d1 execute tripsfactory --remote --file=src/migrations/20260817_170757_add_tour_variant_key.sql
--
-- One nullable column and its index. Every tour that exists today has no
-- sibling, which is exactly what a null variant key means.

ALTER TABLE `tours` ADD `variant_key` text;
CREATE INDEX `tours_variant_key_idx` ON `tours` (`variant_key`);

INSERT INTO `payload_migrations` (`name`, `batch`) VALUES ('20260817_170757_add_tour_variant_key', 7);
