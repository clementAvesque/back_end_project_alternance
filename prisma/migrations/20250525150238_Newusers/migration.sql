-- CreateTable
CREATE TABLE "Client" (
    "id_user" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "phone" INTEGER NOT NULL,
    "ordernum" SERIAL NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_ordernum_key" ON "Client"("ordernum");
