-- Ajout des champs Stripe pour les abonnements
ALTER TABLE `users` 
ADD COLUMN `stripeCustomerId` varchar(64),
ADD COLUMN `stripeSubscriptionId` varchar(64),
ADD COLUMN `subscriptionStatus` enum('free','pro','institution','cancelled') DEFAULT 'free',
ADD COLUMN `subscriptionEndsAt` timestamp;