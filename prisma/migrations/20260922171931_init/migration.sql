-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordTemporal" BOOLEAN NOT NULL DEFAULT false,
    "rol" TEXT NOT NULL DEFAULT 'consultor',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cuentaId" TEXT,
    "empresaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivelJerarquico" TEXT,
    "jefeInmediatoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "publishedAt" TIMESTAMP(3),
    "razonSer" TEXT,
    "criticidadAusencia" TEXT,
    "autonomiaDecision" TEXT,
    "participacionComites" TEXT,
    "eppRequerido" TEXT,
    "protocolosEmergencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funciones_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "frecuencia" TEXT,

    CONSTRAINT "funciones_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flujos_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "contraparte" TEXT,
    "contraparteCargoId" TEXT,

    CONSTRAINT "flujos_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riesgos_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,

    CONSTRAINT "riesgos_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "tipoBarrera" TEXT NOT NULL,
    "descripcionBarrera" TEXT NOT NULL,
    "apoyoSugerido" TEXT NOT NULL,

    CONSTRAINT "ajustes_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "requisitos_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias_perfil" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nivelRequerido" TEXT NOT NULL,

    CONSTRAINT "competencias_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "motivoCambio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_taller" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "bloque" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "facilitador" TEXT,
    "fechaTaller" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_taller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresaId_key" ON "usuarios"("empresaId");

-- CreateIndex
CREATE INDEX "usuarios_cuentaId_idx" ON "usuarios"("cuentaId");

-- CreateIndex
CREATE INDEX "empresas_cuentaId_idx" ON "empresas"("cuentaId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cuentaId_nombre_key" ON "empresas"("cuentaId", "nombre");

-- CreateIndex
CREATE INDEX "departamentos_empresaId_idx" ON "departamentos"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_empresaId_nombre_key" ON "departamentos"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "cargos_empresaId_idx" ON "cargos"("empresaId");

-- CreateIndex
CREATE INDEX "cargos_jefeInmediatoId_idx" ON "cargos"("jefeInmediatoId");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_departamentoId_nombre_key" ON "cargos"("departamentoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_cargoId_key" ON "perfiles"("cargoId");

-- CreateIndex
CREATE INDEX "funciones_perfil_perfilId_idx" ON "funciones_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "flujos_perfil_perfilId_idx" ON "flujos_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "flujos_perfil_contraparteCargoId_idx" ON "flujos_perfil"("contraparteCargoId");

-- CreateIndex
CREATE INDEX "riesgos_perfil_perfilId_idx" ON "riesgos_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "ajustes_perfil_perfilId_idx" ON "ajustes_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "requisitos_perfil_perfilId_idx" ON "requisitos_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "competencias_perfil_perfilId_idx" ON "competencias_perfil"("perfilId");

-- CreateIndex
CREATE INDEX "versiones_perfilId_idx" ON "versiones"("perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_perfilId_numero_key" ON "versiones"("perfilId", "numero");

-- CreateIndex
CREATE INDEX "respuestas_taller_empresaId_idx" ON "respuestas_taller"("empresaId");

-- CreateIndex
CREATE INDEX "respuestas_taller_cargoId_idx" ON "respuestas_taller"("cargoId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_jefeInmediatoId_fkey" FOREIGN KEY ("jefeInmediatoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funciones_perfil" ADD CONSTRAINT "funciones_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flujos_perfil" ADD CONSTRAINT "flujos_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flujos_perfil" ADD CONSTRAINT "flujos_perfil_contraparteCargoId_fkey" FOREIGN KEY ("contraparteCargoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riesgos_perfil" ADD CONSTRAINT "riesgos_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_perfil" ADD CONSTRAINT "ajustes_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_perfil" ADD CONSTRAINT "requisitos_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencias_perfil" ADD CONSTRAINT "competencias_perfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones" ADD CONSTRAINT "versiones_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_taller" ADD CONSTRAINT "respuestas_taller_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_taller" ADD CONSTRAINT "respuestas_taller_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
