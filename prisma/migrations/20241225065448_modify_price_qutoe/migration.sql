/*
  Warnings:

  - You are about to alter the column `userId` on the `pricequote` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `pricequote` MODIFY `userId` INTEGER NULL;
