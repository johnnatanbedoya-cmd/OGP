# OGP — Occupational Growth Platform

App independiente para gestionar la estructura organizacional (Departamentos → Cargos → Perfiles) de una empresa: identificación del cargo, funciones, flujos de trabajo, SST, inclusión/ajustes razonables, y requisitos/competencias — con historial de versiones y exportación a PDF y Word. Multi-empresa con login: cada empresa (cuenta) solo ve su propia estructura.

No comparte código, dependencias ni base de datos con ningún otro proyecto.

**Fase 1 (esta versión):** CRUD de Departamentos/Cargos/Perfiles con versionado y export. **Fases futuras** (ya modeladas en `prisma/schema.prisma` pero sin UI): talleres de campo (`RespuestaTaller`), motor de estandarización con IA, y motor de diagnóstico cruzado.

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (Neon recomendado)

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env` y completa `DATABASE_URL` y `SESSION_SECRET`.
3. `npx prisma migrate dev` — crea las tablas.
4. Completa `SEED_USUARIO_EMAIL` y `SEED_USUARIO_PASSWORD` en `.env`, luego `npm run db:seed` — crea una cuenta y usuario de prueba.
5. `npm run dev` y entra en `http://localhost:3000` con el usuario creado.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` / `npm run start` — build de producción
- `npm run lint` — ESLint
- `npm test` — Vitest
- `npm run db:seed` — siembra cuenta + usuario de prueba
