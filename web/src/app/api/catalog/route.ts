import { getDemoSubjects, getDemoTopics, grades, subjects } from "@/lib/catalog";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const resource = params.get("resource");
  const gradeId = params.get("grade");
  const subjectId = params.get("subject");
  const headers = { "Cache-Control": "no-store" };

  if (resource === "grades") {
    return Response.json({ items: grades.filter((grade) => grade.active).sort((a, b) => a.order - b.order), mode: "demo" }, { headers });
  }

  if (!gradeId || !grades.some((grade) => grade.id === gradeId && grade.active)) {
    return Response.json({ error: "Grado no válido." }, { status: 400, headers });
  }

  if (resource === "subjects") {
    return Response.json({ items: getDemoSubjects(gradeId), mode: "demo" }, { headers });
  }

  if (resource === "topics") {
    const subject = subjects.find((item) => item.id === subjectId);
    const grade = grades.find((item) => item.id === gradeId)!;
    if (!subject || !subject.grades.includes(grade.number)) {
      return Response.json({ error: "Materia no válida para el grado." }, { status: 400, headers });
    }
    return Response.json({ items: getDemoTopics(gradeId, subject.id), mode: "demo" }, { headers });
  }

  return Response.json({ error: "Recurso no válido." }, { status: 400, headers });
}
