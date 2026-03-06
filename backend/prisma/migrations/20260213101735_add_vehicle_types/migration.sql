-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "vehicle_type_id" UUID;

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "front_image" TEXT,
    "rear_image" TEXT,
    "left_image" TEXT,
    "right_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_name_key" ON "vehicle_types"("name");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
