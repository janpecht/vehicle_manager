-- CreateEnum
CREATE TYPE "DamageVisibility" AS ENUM ('NEW_DAMAGE', 'KNOWN_DAMAGE', 'NO_DAMAGE');

-- CreateEnum
CREATE TYPE "CleanlinessLevel" AS ENUM ('CLEAN', 'SLIGHTLY_DIRTY', 'VERY_DIRTY');

-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('OK', 'LOW');

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_submissions" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "mileage" INTEGER NOT NULL,
    "damage_visibility" "DamageVisibility" NOT NULL,
    "seats_cleanliness" "CleanlinessLevel" NOT NULL,
    "smoked_in_vehicle" BOOLEAN NOT NULL,
    "food_leftovers" BOOLEAN NOT NULL,
    "cargo_area_clean" BOOLEAN NOT NULL,
    "freezer_temp_ok" BOOLEAN NOT NULL,
    "charging_cables_ok" BOOLEAN NOT NULL,
    "delivery_notes_present" BOOLEAN,
    "fuel_level" "FuelLevel",
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_submissions_vehicle_id_idx" ON "checklist_submissions"("vehicle_id");

-- CreateIndex
CREATE INDEX "checklist_submissions_driver_id_idx" ON "checklist_submissions"("driver_id");

-- CreateIndex
CREATE INDEX "checklist_submissions_date_idx" ON "checklist_submissions"("date");

-- AddForeignKey
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
