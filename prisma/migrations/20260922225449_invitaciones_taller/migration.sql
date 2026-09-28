-- AlterTable
ALTER TABLE "respuestas_taller" ADD COLUMN     "trabajadorId" TEXT;

-- CreateTable
CREATE TABLE "invitaciones_taller" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_taller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_taller_tokenHash_key" ON "invitaciones_taller"("tokenHash");

-- CreateIndex
CREATE INDEX "invitaciones_taller_empresaId_idx" ON "invitaciones_taller"("empresaId");

-- CreateIndex
CREATE INDEX "invitaciones_taller_trabajadorId_idx" ON "invitaciones_taller"("trabajadorId");

-- CreateIndex
CREATE INDEX "respuestas_taller_trabajadorId_idx" ON "respuestas_taller"("trabajadorId");

-- AddForeignKey
ALTER TABLE "respuestas_taller" ADD CONSTRAINT "respuestas_taller_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones_taller" ADD CONSTRAINT "invitaciones_taller_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones_taller" ADD CONSTRAINT "invitaciones_taller_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
