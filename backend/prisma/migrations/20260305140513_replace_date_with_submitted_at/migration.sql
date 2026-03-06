-- AlterTable: replace date column with submitted_at (DateTime with default now())
ALTER TABLE "checklist_submissions" DROP COLUMN "date";
ALTER TABLE "checklist_submissions" ADD COLUMN "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX IF EXISTS "checklist_submissions_date_idx";

-- CreateIndex
CREATE INDEX "checklist_submissions_submitted_at_idx" ON "checklist_submissions"("submitted_at");
