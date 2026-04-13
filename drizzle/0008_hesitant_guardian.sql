ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(8) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationsEnabled` boolean DEFAULT true NOT NULL;