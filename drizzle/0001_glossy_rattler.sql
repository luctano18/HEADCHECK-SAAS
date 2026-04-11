CREATE TABLE `ai_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkInId` int NOT NULL,
	`userId` int NOT NULL,
	`emotionalReflection` text NOT NULL,
	`brainInsight` text NOT NULL,
	`eiPillar` varchar(128) NOT NULL,
	`eiPillarDescription` text NOT NULL,
	`aieiProverb` text NOT NULL,
	`aieiProverbOrigin` varchar(128),
	`personalizedNextStep` text NOT NULL,
	`supportInvitation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_responses_checkInId_unique` UNIQUE(`checkInId`)
);
--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emotion` varchar(64) NOT NULL,
	`emotionEmoji` varchar(8),
	`intensity` int NOT NULL,
	`context` enum('School','Family','Relationships','Work','Self') NOT NULL,
	`journalEntry` text,
	`crisisDetected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crisis_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkInId` int,
	`triggerText` text,
	`severity` enum('moderate','high','critical') NOT NULL,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`facilitatorNotified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crisis_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`institutionId` int NOT NULL,
	`facilitatorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`adminId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`institutionId` int NOT NULL,
	`groupId` int,
	`invitedByUserId` int NOT NULL,
	`accepted` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `seven_mirrors_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`mirrorIndex` int NOT NULL,
	`mirrorTheme` varchar(64) NOT NULL,
	`response` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seven_mirrors_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seven_mirrors_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentMirrorIndex` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`aiSummary` text,
	`badgesEarned` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `seven_mirrors_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('student','facilitator','admin','superadmin') NOT NULL DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `users` ADD `institutionId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `groupId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;