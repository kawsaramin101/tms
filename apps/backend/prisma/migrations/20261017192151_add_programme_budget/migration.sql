-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `programme_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `programmes` (
    `programme_id` INTEGER NOT NULL AUTO_INCREMENT,
    `programme_code` VARCHAR(50) NOT NULL,
    `programme_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `status` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `programmes_programme_code_key`(`programme_code`),
    PRIMARY KEY (`programme_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `budget_id` INTEGER NOT NULL AUTO_INCREMENT,
    `programme_id` INTEGER NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `budget_amount` DECIMAL(15, 2) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `budgets_programme_id_idx`(`programme_id`),
    PRIMARY KEY (`budget_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `transactions_programme_id_idx` ON `transactions`(`programme_id`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_programme_id_fkey` FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_programme_id_fkey` FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
