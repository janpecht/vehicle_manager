-- CreateTable
CREATE TABLE "vehicle_type_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_type_id" UUID NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "data" BYTEA NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_type_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_type_images_vehicle_type_id_side_key" ON "vehicle_type_images"("vehicle_type_id", "side");

-- AddForeignKey
ALTER TABLE "vehicle_type_images" ADD CONSTRAINT "vehicle_type_images_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
