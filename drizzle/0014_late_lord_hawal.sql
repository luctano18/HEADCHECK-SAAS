ALTER TABLE `ai_responses` ADD `patternInsight` text;--> statement-breakpoint
ALTER TABLE `ai_responses` ADD `feedbackRating` enum('helpful','not_helpful');--> statement-breakpoint
ALTER TABLE `ai_responses` ADD `feedbackText` text;