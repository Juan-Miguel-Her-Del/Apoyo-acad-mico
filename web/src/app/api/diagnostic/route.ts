import { evaluateDemoAnswer, getDiagnostic } from "@/lib/diagnostic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const result = getDiagnostic(params.get("grade") ?? "", params.get("subject") ?? "", params.get("topic") ?? "", params.get("mode") ?? "published");
  return Response.json(result.status === 200 ? result : { error: result.error }, { status: result.status, headers });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Solicitud no válida." }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Solicitud no válida." }, { status: 400, headers });
  const data = body as Record<string, unknown>;
  if (["gradeId", "subjectId", "topicId", "questionId", "optionId"].some((key) => typeof data[key] !== "string")) {
    return Response.json({ error: "Solicitud incompleta." }, { status: 400, headers });
  }
  if (data.mode !== "demo") return Response.json({ error: "La evaluación publicada aún no está disponible." }, { status: 409, headers });
  const result = evaluateDemoAnswer(data.gradeId as string, data.subjectId as string, data.topicId as string, data.questionId as string, data.optionId as string);
  return Response.json(result.status === 200 ? result : { error: result.error }, { status: result.status, headers });
}
