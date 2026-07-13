-- Table des alertes de risque par groupe (alertes proactives)
CREATE TABLE `group_risk_alerts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `institutionId` int NOT NULL,
  `groupId` int,
  `groupName` varchar(255) NOT NULL,
  `avgIntensity` float NOT NULL,
  `threshold` float NOT NULL DEFAULT 7.0,
  `periodDays` int NOT NULL DEFAULT 3,
  `alertSentAt` timestamp NOT NULL DEFAULT (now()),
  `acknowledged` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `group_risk_alerts_id` PRIMARY KEY(`id`)
);