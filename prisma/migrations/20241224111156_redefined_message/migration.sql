/*
  Warnings:

  - You are about to drop the column `senderId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `senderPhotoUrl` on the `message` table. All the data in the column will be lost.
  - Added the required column `address` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `message` DROP COLUMN `senderId`,
    DROP COLUMN `senderPhotoUrl`,
    ADD COLUMN `address` VARCHAR(191) NOT NULL;
