ALTER TABLE `alert_actions` MODIFY COLUMN `actionType` enum('acknowledged','contacted_student','escalated','referred_to_counselor','resolved','note_added','protocol_initiated','assigned') NOT NULL;--> statement-breakpoint
ALTER TABLE `alert_actions` ADD `assignedToId` int;--> statement-breakpoint
ALTER TABLE `crisis_events` ADD `assignedToId` int;--> statement-breakpoint
ALTER TABLE `crisis_events` ADD `assignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `violence_flags` ADD `assignedToId` int;--> statement-breakpoint
ALTER TABLE `violence_flags` ADD `assignedAt` timestamp;