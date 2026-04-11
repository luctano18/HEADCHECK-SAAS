CREATE TABLE `business_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`teamSize` enum('1-10','11-50','51-200','201-500','500+') NOT NULL,
	`industry` varchar(128),
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(32),
	`wellnessGoals` text NOT NULL,
	`status` enum('pending','validated','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`institutionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`validatedAt` timestamp,
	CONSTRAINT `business_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionType` enum('30min','60min','3session','organization') NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`zoomLink` text,
	`notes` text,
	`questionnaire` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulse_survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pulse_survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulse_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pulse_surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellness_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionId` int,
	`addedByUserId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`url` text,
	`resourceType` enum('article','video','book','exercise','tool','podcast') NOT NULL,
	`eiPillar` enum('Self-Awareness','Self-Regulation','Motivation','Empathy','Social Skills','All') NOT NULL DEFAULT 'All',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wellness_resources_id` PRIMARY KEY(`id`)
);
