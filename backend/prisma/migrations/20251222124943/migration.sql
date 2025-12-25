-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'PROCESS_FAIL', 'DONE');

-- CreateTable
CREATE TABLE "KeyPoint" (
    "id" SERIAL NOT NULL,
    "record_id" TEXT NOT NULL,
    "time_point" INTEGER NOT NULL,
    "remark" TEXT,
    "content" TEXT NOT NULL,
    "speaker" TEXT,

    CONSTRAINT "KeyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "begin_time" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "remark" TEXT,
    "url" TEXT,
    "path" TEXT,
    "content" TEXT,
    "speakers" TEXT[],
    "status" "RecordStatus" NOT NULL DEFAULT 'UPLOADING',

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wifi_mac" TEXT NOT NULL,
    "flash_size" INTEGER NOT NULL,
    "ram_size" INTEGER NOT NULL,
    "chip_id" TEXT NOT NULL,
    "reset_reason" TEXT NOT NULL,
    "idf_version" TEXT NOT NULL,
    "firmware_version" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KeyPoint" ADD CONSTRAINT "KeyPoint_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
