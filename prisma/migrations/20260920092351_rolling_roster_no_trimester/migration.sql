/*
  Warnings:

  - You are about to drop the column `trimesterId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `trimesters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_trimesterId_fkey";

-- DropForeignKey
ALTER TABLE "trimesters" DROP CONSTRAINT "trimesters_schoolYearId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "trimesterId";

-- AlterTable
ALTER TABLE "recurring_series" ADD COLUMN     "weeksAhead" INTEGER NOT NULL DEFAULT 4;

-- DropTable
DROP TABLE "trimesters";
