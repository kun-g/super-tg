/*
  Warnings:

  - The `createdAt` column on the `hourlybonus` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `updatedAt` on the `hourlybonus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE `hourlybonus` DROP COLUMN `createdAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    DROP COLUMN `updatedAt`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
