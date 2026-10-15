import { topics } from "@/lib/catalog";
import { practiceBankCoverage } from "@/lib/practice";
import { noStore } from "@/lib/auth-http";

export const runtime = "nodejs";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const gradeId = params.get("gradeId") ?? "";
  const subjectId = params.get("subjectId") ?? "";
  const topicId = params.get("topicId") ?? "";
  if (!topics.some((topic) => topic.id === topicId && topic.gradeId === gradeId &&
    topic.subjectId === subjectId && topic.active && topic.pilotCandidate)) {
    return Response.json({ error: "Tema no válido." }, { status: 400, headers: noStore });
  }
  return Response.json(practiceBankCoverage(gradeId, subjectId, topicId), { headers: noStore });
}
