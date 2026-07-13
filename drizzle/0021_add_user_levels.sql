-- Ajout du système de niveaux et XP
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