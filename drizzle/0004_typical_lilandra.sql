ALTER TABLE `profiles` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `profiles` ADD `profile_type` text DEFAULT 'child' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_household_user_idx` ON `profiles` (`household_id`,`user_id`);