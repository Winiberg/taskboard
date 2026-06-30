/*
  Warnings:

  - You are about to drop the column `userId` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropIndex
DROP INDEX "Product_userId_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VENDEDOR';

-- CreateTable
CREATE TABLE "Sale" (
    "id_venta" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "id_producto" TEXT NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id_venta")
);

-- CreateIndex
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");

-- CreateIndex
CREATE INDEX "Sale_id_producto_idx" ON "Sale"("id_producto");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Product"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;
