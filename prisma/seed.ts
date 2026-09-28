import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

async function main() {
  const nombreCuenta = process.env.SEED_EMPRESA_NOMBRE || "Cuenta de Consultor";
  const email = process.env.SEED_USUARIO_EMAIL;
  const password = process.env.SEED_USUARIO_PASSWORD;
  const nombreUsuario = process.env.SEED_USUARIO_NOMBRE || "Consultor";

  if (!email || !password) {
    throw new Error("Define SEED_USUARIO_EMAIL y SEED_USUARIO_PASSWORD en .env antes de sembrar datos");
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const cuenta = await prisma.cuenta.upsert({
    where: { id: "seed-cuenta-consultor" },
    update: {},
    create: { id: "seed-cuenta-consultor", nombre: nombreCuenta },
  });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, cuentaId: cuenta.id, rol: "consultor" },
    create: {
      nombre: nombreUsuario,
      email,
      passwordHash,
      cuentaId: cuenta.id,
      rol: "consultor",
    },
  });

  console.log(`Cuenta consultora "${cuenta.nombre}" y usuario "${email}" listos.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
