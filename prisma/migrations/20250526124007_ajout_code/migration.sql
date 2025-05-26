/*
  Warnings:

  - You are about to drop the column `ordernum` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mail]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Client_ordernum_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "ordernum",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Client_mail_key" ON "Client"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
