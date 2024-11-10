-- CreateTable
CREATE TABLE "Playgrounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "env" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Playgrounds_name_key" ON "Playgrounds"("name");

-- AddForeignKey
ALTER TABLE "Playgrounds" ADD CONSTRAINT "Playgrounds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
