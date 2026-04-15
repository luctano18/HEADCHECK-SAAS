CREATE TABLE `alert_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`alertType` enum('crisis','violence') NOT NULL,
	`crisisEventId` int,
	`violenceFlagId` int,
	`actionType` enum('acknowledged','contacted_student','escalated','referred_to_counselor','resolved','note_added','protocol_initiated') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_actions_id` PRIMARY KEY(`id`)
);
