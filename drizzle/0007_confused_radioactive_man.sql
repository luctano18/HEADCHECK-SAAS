CREATE TABLE `safety_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trustedContacts` json,
	`warningSignals` json,
	`copingStrategies` json,
	`safeEnvironments` json,
	`professionalSupport` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `safety_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `safety_plans_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `violence_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkInId` int,
	`triggerText` text,
	`flagType` enum('self_harm','violence_toward_others','crisis') NOT NULL,
	`severity` enum('moderate','high','critical') NOT NULL,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`facilitatorNotified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `violence_flags_id` PRIMARY KEY(`id`)
);
