/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `order` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` DROP COLUMN `updatedAt`,
    ADD COLUMN `content` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `expiresAt` DATETIME(3) NOT NULL;
