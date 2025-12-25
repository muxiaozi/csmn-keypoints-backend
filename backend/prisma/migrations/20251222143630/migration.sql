/*
  Warnings:

  - Added the required column `index` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "index" INTEGER NOT NULL;
