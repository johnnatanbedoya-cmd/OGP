// Prisma 7 requiere un driver adapter explícito (ya no hay motor embebido
// por defecto). PostgreSQL en Neon vía @prisma/adapter-neon — usa el driver
// serverless de Neon (WebSocket), pensado para funcionar bien con la cadena
// de conexión "pooled" (con "-pooler" en el host).
//
// neonConfig.webSocketConstructor: el driver de Neon usa el WebSocket nativo
// del entorno si existe, pero no todos los entornos serverless lo tienen —
// sin esto, cualquier consulta a la base de datos falla en producción aunque
// funcione en local. Se fija explícito con el paquete `ws`.
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
