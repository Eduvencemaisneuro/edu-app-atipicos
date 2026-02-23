CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64) NOT NULL,
	`color` varchar(32) NOT NULL,
	`category` enum('games','progress','streak','milestone','special') NOT NULL,
	`requirement` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`gameId` int NOT NULL,
	`professionalId` int,
	`score` int DEFAULT 0,
	`maxScore` int DEFAULT 100,
	`duration` int DEFAULT 0,
	`completed` boolean DEFAULT false,
	`starsEarned` int DEFAULT 0,
	`sessionData` json DEFAULT ('{}'),
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('cognitive','language','socioemotional','sensory','motor','math') NOT NULL,
	`ageGroups` json DEFAULT ('[]'),
	`cognitiveProfiles` json DEFAULT ('[]'),
	`difficultyLevel` enum('basic','intermediate','advanced') DEFAULT 'basic',
	`gameType` varchar(64) NOT NULL,
	`thumbnailUrl` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`professionalId` int NOT NULL,
	`contentType` enum('activity_sheet','game_suggestion','educational_content','progress_summary') NOT NULL,
	`prompt` text,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('cards','worksheets','routines','guides','stories','other') NOT NULL,
	`fileUrl` text,
	`fileKey` text,
	`mimeType` varchar(128),
	`thumbnailUrl` text,
	`ageGroups` json DEFAULT ('[]'),
	`cognitiveProfiles` json DEFAULT ('[]'),
	`tags` json DEFAULT ('[]'),
	`isPublic` boolean DEFAULT true,
	`downloadCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studentId` int,
	`type` enum('activity_completed','milestone_reached','attention_needed','badge_earned','report_ready','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`data` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`specialty` varchar(128),
	`institution` varchar(256),
	`bio` text,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`professionalId` int NOT NULL,
	`recordType` enum('observation','evolution','behavior','development','session') NOT NULL,
	`title` varchar(256),
	`content` text NOT NULL,
	`attachmentUrl` text,
	`attachmentKey` text,
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progress_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`professionalId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`period` varchar(64),
	`fileUrl` text,
	`fileKey` text,
	`isShared` boolean DEFAULT false,
	`sharedWith` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`awardedBy` int,
	CONSTRAINT `student_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`birthDate` timestamp,
	`gender` enum('male','female','other','not_informed') DEFAULT 'not_informed',
	`avatarUrl` text,
	`diagnosis` json DEFAULT ('[]'),
	`cognitiveProfile` enum('tea','tdah','di','down','dyslexia','language','typical','other') DEFAULT 'typical',
	`ageGroup` enum('0-3','4-6','7-10','11-14','15-18') DEFAULT '4-6',
	`specificNeeds` text,
	`adaptations` text,
	`communicationLevel` enum('non_verbal','emerging','functional','verbal') DEFAULT 'verbal',
	`reducedStimulus` boolean DEFAULT false,
	`visualSupport` boolean DEFAULT true,
	`difficultyLevel` enum('basic','intermediate','advanced') DEFAULT 'basic',
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('lecture','activity','social_story','tutorial','therapy','other') NOT NULL,
	`videoType` enum('youtube','upload') DEFAULT 'youtube',
	`youtubeUrl` text,
	`fileUrl` text,
	`fileKey` text,
	`thumbnailUrl` text,
	`duration` int DEFAULT 0,
	`ageGroups` json DEFAULT ('[]'),
	`cognitiveProfiles` json DEFAULT ('[]'),
	`tags` json DEFAULT ('[]'),
	`isPublic` boolean DEFAULT true,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `profileType` enum('professional','student','guardian') DEFAULT 'professional';