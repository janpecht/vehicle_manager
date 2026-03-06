-- Add isActive column to vehicles (default true so existing vehicles remain active)
ALTER TABLE "vehicles" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
