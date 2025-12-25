/*
  Warnings:

  - Made the column `due_date` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "due_date" SET NOT NULL,
ALTER COLUMN "status_changed_at" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP NOT NULL;
