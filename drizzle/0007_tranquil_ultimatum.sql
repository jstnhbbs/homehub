DROP INDEX IF EXISTS `calendar_connections_household_idx`;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD `provider` text DEFAULT 'icloud' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD `account_email` text;--> statement-breakpoint
UPDATE `calendar_connections` SET `account_email` = `apple_id` WHERE `account_email` IS NULL;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD `encrypted_refresh_token` text;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD `encrypted_access_token` text;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD `access_token_expires_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_connections_household_provider_idx` ON `calendar_connections` (`household_id`,`provider`);
