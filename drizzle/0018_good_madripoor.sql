CREATE TABLE `intervention_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int,
	`greenMaxScore` int NOT NULL DEFAULT 4,
	`yellowMaxScore` int NOT NULL DEFAULT 9,
	`yellowRepeatDays` int NOT NULL DEFAULT 7,
	`yellowRepeatCount` int NOT NULL DEFAULT 3,
	`lowResolutionCount` int NOT NULL DEFAULT 2,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intervention_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkInId` int NOT NULL,
	`primaryEmotion` varchar(64) NOT NULL,
	`contributors` json NOT NULL,
	`emotionalImpact` json NOT NULL,
	`intenseFeelings` json NOT NULL,
	`secondaryStressors` json NOT NULL,
	`supportPreference` varchar(128),
	`possibleNextStep` varchar(128),
	`supportSource` varchar(128),
	`didHelp` enum('yes_clearer','somewhat_calmer','not_yet'),
	`otherInputs` json,
	`journalNotes` text,
	`emotionalIntensityScore` int NOT NULL DEFAULT 0,
	`stressLoadScore` int NOT NULL DEFAULT 0,
	`readinessScore` int NOT NULL DEFAULT 0,
	`totalScore` int NOT NULL DEFAULT 0,
	`tier` enum('green','yellow','red') NOT NULL DEFAULT 'green',
	`riskOverride` boolean NOT NULL DEFAULT false,
	`riskLevel` enum('none','crisis') NOT NULL DEFAULT 'none',
	`riskReasons` json,
	`stabilizationMessage` text,
	`nextStep` varchar(256),
	`nextStepReason` text,
	`escalationTriggered` boolean NOT NULL DEFAULT false,
	`escalationReason` varchar(256),
	`supportPromptShown` boolean NOT NULL DEFAULT false,
	`supportSelection` varchar(128),
	`facilitatorNotified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intervention_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `intervention_sessions_checkInId_unique` UNIQUE(`checkInId`)
);
--> statement-breakpoint
CREATE TABLE `pattern_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flagType` enum('recurring_emotion','escalation_pattern','low_resolution','support_avoidance','support_seeking') NOT NULL,
	`flagValue` varchar(128),
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`shownToUser` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pattern_flags_id` PRIMARY KEY(`id`)
);
