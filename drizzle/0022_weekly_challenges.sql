-- Table des défis hebdomadaires
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