/*
  Warnings:

  - You are about to drop the `conversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `Conversation_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `Conversation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropIndex
DROP INDEX `Message_conversationId_fkey` ON `message`;

-- DropTable
DROP TABLE `conversation`;
