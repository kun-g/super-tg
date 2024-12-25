-- CreateTable
CREATE TABLE `PriceQuote` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lockedVersion` INTEGER NOT NULL,
    `lockedCost` DECIMAL(65, 30) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `pricingStateId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `expireAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PriceQuote` ADD CONSTRAINT `PriceQuote_pricingStateId_fkey` FOREIGN KEY (`pricingStateId`) REFERENCES `PricingState`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
