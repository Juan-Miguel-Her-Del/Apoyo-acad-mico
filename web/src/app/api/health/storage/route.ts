import { postgres } from "@/lib/postgres";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    return Response.json({ storage: "sqlite", postgresReady: false }, { headers: noStore });
  }

  try {
    // La primera consulta también crea el esquema en una base PostgreSQL vacía.
    await postgres.prepare("SELECT 1 AS ready").get();
    return Response.json({ storage: "postgresql", postgresReady: true }, { headers: noStore });
  } catch (error) {
    // No registrar la URL ni las credenciales de la base en los logs.
    console.error("PostgreSQL no disponible:", (error as { code?: string }).code ?? "unknown");
    return Response.json({ storage: "postgresql", postgresReady: false },
      { status: 503, headers: noStore });
  }
}
