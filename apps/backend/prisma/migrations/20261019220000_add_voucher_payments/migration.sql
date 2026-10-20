-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `voucher_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `vouchers` ADD COLUMN `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `transactions_voucher_id_idx` ON `transactions`(`voucher_id`);

-- CreateIndex
CREATE UNIQUE INDEX `transactions_voucher_id_reference_number_key` ON `transactions`(`voucher_id`, `reference_number`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`voucher_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
