/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Message_address_key` ON `Message`(`address`);
