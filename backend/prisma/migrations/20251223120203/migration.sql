/*
  Warnings:

  - A unique constraint covering the columns `[device_id,index]` on the table `Record` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "crc16" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Record_device_id_index_key" ON "Record"("device_id", "index");
