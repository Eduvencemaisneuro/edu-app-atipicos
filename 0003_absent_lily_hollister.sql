CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','monthly','annual') NOT NULL DEFAULT 'free',
	`status` enum('active','cancelled','expired','trialing') NOT NULL DEFAULT 'active',
	`studentsUsed` int NOT NULL DEFAULT 0,
	`reportsUsedThisMonth` int NOT NULL DEFAULT 0,
	`llmUsedThisMonth` int NOT NULL DEFAULT 0,
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp DEFAULT (now()),
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD `isPremium` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `materials` ADD `isPremium` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `videos` ADD `isPremium` boolean DEFAULT false;