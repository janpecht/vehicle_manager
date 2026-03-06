-- CreateTable
CREATE TABLE "checklist_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submission_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_photos_submission_id_idx" ON "checklist_photos"("submission_id");

-- AddForeignKey
ALTER TABLE "checklist_photos" ADD CONSTRAINT "checklist_photos_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "checklist_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
