-- CreateTable
CREATE TABLE `HourlyBonus` (
    `id` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `totalBonus` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,
    `lastOrderId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBonus` (
    `id` VARCHAR(191) NOT NULL,
    `hourlyBonusId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `bonusAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HourlyBonus` ADD CONSTRAINT `HourlyBonus_lastOrderId_fkey` FOREIGN KEY (`lastOrderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HourlyBonus` ADD CONSTRAINT `HourlyBonus_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBonus` ADD CONSTRAINT `UserBonus_hourlyBonusId_fkey` FOREIGN KEY (`hourlyBonusId`) REFERENCES `HourlyBonus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBonus` ADD CONSTRAINT `UserBonus_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
