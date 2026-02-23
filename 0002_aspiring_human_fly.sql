ALTER TABLE `game_sessions` MODIFY COLUMN `sessionData` json;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `ageGroups` json;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `cognitiveProfiles` json;--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `ageGroups` json;--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `cognitiveProfiles` json;--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `data` json;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `sharedWith` json;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `diagnosis` json;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `ageGroups` json;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `cognitiveProfiles` json;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `tags` json;