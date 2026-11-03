ALTER TABLE `notifications` ADD COLUMN `dedupe_key` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `notifications_dedupe_key_key` ON `notifications`(`dedupe_key`);

CREATE TABLE `notification_preferences` (
  `preference_id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `transaction` BOOLEAN NOT NULL DEFAULT true,
  `payment_reminder` BOOLEAN NOT NULL DEFAULT true,
  `payment_overdue` BOOLEAN NOT NULL DEFAULT true,
  `low_inventory` BOOLEAN NOT NULL DEFAULT true,
  `task_reminder` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX `notification_preferences_user_id_key`(`user_id`),
  PRIMARY KEY (`preference_id`),
  CONSTRAINT `notification_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
