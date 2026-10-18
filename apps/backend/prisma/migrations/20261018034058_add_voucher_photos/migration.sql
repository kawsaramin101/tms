-- CreateTable
CREATE TABLE `voucher_photos` (
    `photo_id` INTEGER NOT NULL AUTO_INCREMENT,
    `voucher_id` INTEGER NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `voucher_photos_voucher_id_idx`(`voucher_id`),
    INDEX `voucher_photos_uploaded_by_idx`(`uploaded_by`),
    PRIMARY KEY (`photo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `voucher_photos` ADD CONSTRAINT `voucher_photos_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`voucher_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher_photos` ADD CONSTRAINT `voucher_photos_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
