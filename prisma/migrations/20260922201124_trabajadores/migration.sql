-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "email" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trabajadores_empresaId_idx" ON "trabajadores"("empresaId");

-- CreateIndex
CREATE INDEX "trabajadores_cargoId_idx" ON "trabajadores"("cargoId");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_empresaId_documento_key" ON "trabajadores"("empresaId", "documento");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
