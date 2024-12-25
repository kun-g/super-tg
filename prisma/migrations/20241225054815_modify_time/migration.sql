/*
  Warnings:

  - Changed the type of `startTime` on the `hourlybonus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `hourlybonus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdAt` on the `hourlybonus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updatedAt` on the `hourlybonus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE `hourlybonus` DROP COLUMN `startTime`,
    ADD COLUMN `startTime` INTEGER NOT NULL,
    DROP COLUMN `endTime`,
    ADD COLUMN `endTime` INTEGER NOT NULL,
    DROP COLUMN `createdAt`,
    ADD COLUMN `createdAt` INTEGER NOT NULL,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `updatedAt` INTEGER NOT NULL;
