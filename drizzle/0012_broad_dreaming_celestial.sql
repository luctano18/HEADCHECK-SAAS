CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notif_type` enum('crisis_alert','violence_flag','alert_assigned','new_comment','new_checkin') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`link` varchar(512),
	`read` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
