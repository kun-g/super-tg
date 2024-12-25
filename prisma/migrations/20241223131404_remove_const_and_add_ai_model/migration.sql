/*
  Warnings:

  - You are about to drop the column `cost` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `count` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `State` on the `dragonstate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `conversation` DROP COLUMN `cost`,
    DROP COLUMN `count`,
    DROP COLUMN `version`;

-- AlterTable
ALTER TABLE `dragonstate` DROP COLUMN `State`,
    ADD COLUMN `state` VARCHAR(191) NOT NULL DEFAULT 'unExtracted';

-- CreateTable
CREATE TABLE `PricingState` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL DEFAULT 1,
    `count` INTEGER NOT NULL DEFAULT 0,
    `cost` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModel` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'ONLY_ONE',
    `isBusy` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER NOT NULL DEFAULT 1,
    `currentUserId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
