-- CreateTable
CREATE TABLE "funciones_comunes_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "alcance" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "frecuencia" TEXT,
    "criterioDesempeno" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funciones_comunes_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias_comunes_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "alcance" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivelRequerido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competencias_comunes_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funciones_comunes_empresa_empresaId_idx" ON "funciones_comunes_empresa"("empresaId");

-- CreateIndex
CREATE INDEX "competencias_comunes_empresa_empresaId_idx" ON "competencias_comunes_empresa"("empresaId");

-- AddForeignKey
ALTER TABLE "funciones_comunes_empresa" ADD CONSTRAINT "funciones_comunes_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencias_comunes_empresa" ADD CONSTRAINT "competencias_comunes_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
