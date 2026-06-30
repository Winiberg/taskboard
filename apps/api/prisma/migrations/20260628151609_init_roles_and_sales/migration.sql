/*
  Warnings:

  - You are about to drop the column `cantidad` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `id_producto` on the `Sale` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_id_producto_fkey";

-- DropIndex
DROP INDEX "Sale_id_producto_idx";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "cantidad",
DROP COLUMN "id_producto";

-- CreateTable
CREATE TABLE "SaleDetail" (
    "id_detalle" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" INTEGER NOT NULL,
    "id_venta" TEXT NOT NULL,
    "id_producto" TEXT NOT NULL,

    CONSTRAINT "SaleDetail_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateIndex
CREATE INDEX "SaleDetail_id_venta_idx" ON "SaleDetail"("id_venta");

-- CreateIndex
CREATE INDEX "SaleDetail_id_producto_idx" ON "SaleDetail"("id_producto");

-- AddForeignKey
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "Sale"("id_venta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Product"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;
