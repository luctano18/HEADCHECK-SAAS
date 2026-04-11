CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestToken` varchar(64),
	`selfAwarenessScore` int NOT NULL,
	`selfRegulationScore` int NOT NULL,
	`motivationScore` int NOT NULL,
	`empathyScore` int NOT NULL,
	`socialSkillsScore` int NOT NULL,
	`totalScore` int NOT NULL,
	`level` enum('Emerging','Developing','Proficient','Advanced','Exceptional') NOT NULL,
	`answers` json NOT NULL,
	`aiInsight` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
