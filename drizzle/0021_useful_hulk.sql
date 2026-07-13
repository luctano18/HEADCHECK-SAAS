CREATE TABLE `group_risk_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`groupId` int,
	`groupName` varchar(255) NOT NULL,
	`avgIntensity` float NOT NULL,
	`threshold` float NOT NULL DEFAULT 7,
	`periodDays` int NOT NULL DEFAULT 3,
	`alertSentAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledged` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_risk_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`xp` int NOT NULL DEFAULT 0,
	`xpToNextLevel` int NOT NULL DEFAULT 100,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_levels_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`challengeKey` varchar(64) NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` varchar(256) NOT NULL,
	`xpReward` int NOT NULL DEFAULT 30,
	`progress` int NOT NULL DEFAULT 0,
	`target` int NOT NULL DEFAULT 1,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('free','pro','institution','cancelled') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndsAt` timestamp;