-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('ROTATION', 'EVERYONE', 'SPECIFIC');

-- AlterTable
ALTER TABLE "recurring_series" ADD COLUMN     "assignmentMode" "AssignmentMode" NOT NULL DEFAULT 'ROTATION';

-- CreateTable
CREATE TABLE "recurring_series_invites" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_series_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_series_invites_seriesId_userId_key" ON "recurring_series_invites"("seriesId", "userId");

-- AddForeignKey
ALTER TABLE "recurring_series_invites" ADD CONSTRAINT "recurring_series_invites_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "recurring_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_series_invites" ADD CONSTRAINT "recurring_series_invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
