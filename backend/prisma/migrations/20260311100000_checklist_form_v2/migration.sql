-- Add new columns
ALTER TABLE "checklist_submissions" ADD COLUMN "dashboard_warnings" TEXT[] DEFAULT '{}';
ALTER TABLE "checklist_submissions" ADD COLUMN "car_wash_needed" BOOLEAN;
ALTER TABLE "checklist_submissions" ADD COLUMN "seats_dirty" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "checklist_submissions" ADD COLUMN "cargo_area_dirty" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing data
UPDATE "checklist_submissions" SET "seats_dirty" = ("seats_cleanliness" != 'CLEAN');
UPDATE "checklist_submissions" SET "cargo_area_dirty" = NOT "cargo_area_clean";

-- Drop old columns and enum
ALTER TABLE "checklist_submissions" DROP COLUMN "seats_cleanliness";
ALTER TABLE "checklist_submissions" DROP COLUMN "cargo_area_clean";
DROP TYPE IF EXISTS "CleanlinessLevel";
