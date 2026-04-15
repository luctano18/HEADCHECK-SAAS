CREATE TABLE `alert_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('crisis','violence') NOT NULL,
	`alertId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`editedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_comments_id` PRIMARY KEY(`id`)
);
