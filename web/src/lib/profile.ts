import { grades } from "./catalog.ts";

export type AccountProfile = {
  role: "adult_student" | "minor_student";
  displayName: string;
  gradeId: string;
  updatedAt: string;
};

export function profileInput(body: unknown): { displayName: string; gradeId: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["displayName", "gradeId"].includes(key))) return null;
  if (typeof data.displayName !== "string" || typeof data.gradeId !== "string") return null;
  const displayName = data.displayName.trim().replace(/\s+/g, " ");
  if (displayName.length < 2 || displayName.length > 40 || /[<>\x00-\x1f\x7f]/.test(displayName)) return null;
  if (!grades.some((grade) => grade.id === data.gradeId && grade.active)) return null;
  return { displayName, gradeId: data.gradeId };
}
