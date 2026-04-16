ALTER TABLE `users` ADD `reminderEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `reminderTime` varchar(5) DEFAULT '08:00';--> statement-breakpoint
ALTER TABLE `users` ADD `reminderDays` varchar(32) DEFAULT '1,2,3,4,5';