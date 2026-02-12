-- CreateEnum
CREATE TYPE "ViewSide" AS ENUM ('FRONT', 'REAR', 'LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "Shape" AS ENUM ('CIRCLE', 'RECTANGLE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "damage_markings" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "view_side" "ViewSide" NOT NULL,
    "shape" "Shape" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "severity" "Severity" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "repaired_at" TIMESTAMP(3),
    "repaired_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "damage_markings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "damage_markings_vehicle_id_idx" ON "damage_markings"("vehicle_id");

-- CreateIndex
CREATE INDEX "damage_markings_vehicle_id_view_side_idx" ON "damage_markings"("vehicle_id", "view_side");

-- CreateIndex
CREATE INDEX "damage_markings_vehicle_id_is_active_idx" ON "damage_markings"("vehicle_id", "is_active");

-- AddForeignKey
ALTER TABLE "damage_markings" ADD CONSTRAINT "damage_markings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_markings" ADD CONSTRAINT "damage_markings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_markings" ADD CONSTRAINT "damage_markings_repaired_by_fkey" FOREIGN KEY ("repaired_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
