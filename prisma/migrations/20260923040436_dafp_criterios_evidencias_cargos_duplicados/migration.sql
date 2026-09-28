-- DropIndex
DROP INDEX "cargos_departamentoId_nombre_key";

-- AlterTable
ALTER TABLE "funciones_perfil" ADD COLUMN     "criterioDesempeno" TEXT;

-- AlterTable
ALTER TABLE "perfiles" ADD COLUMN     "evidenciaConocimiento" TEXT,
ADD COLUMN     "evidenciaDesempeno" TEXT,
ADD COLUMN     "evidenciaProducto" TEXT;

-- CreateIndex
CREATE INDEX "cargos_departamentoId_idx" ON "cargos"("departamentoId");
