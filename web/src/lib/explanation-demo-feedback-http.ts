import { AuthError } from "./auth.ts";
import { apiError, ensureAccountsEnabled, ensureSameOrigin, noStore, readJson } from "./auth-http.ts";
import type { DemoFeedback } from "./explanation-demo-feedback.ts";

export type DemoFeedbackHttpDeps = {
  userId: (request: Request) => string | null;
  get: (userId: string, topicId: unknown, explanationId?: unknown) => DemoFeedback | null;
  put: (userId: string, body: unknown) => DemoFeedback;
};

export async function handleDemoFeedback(request: Request, deps: DemoFeedbackHttpDeps): Promise<Response> {
  try {
    ensureAccountsEnabled(request);
    if (request.method === "POST") ensureSameOrigin(request);
    const userId = deps.userId(request);
    if (!userId) throw new AuthError(401, "Sesión requerida.");
    if (request.method === "GET") {
      const topicId = new URL(request.url).searchParams.get("topicId");
      const explanationId = new URL(request.url).searchParams.get("explanationId");
      return Response.json({ feedback: deps.get(userId, topicId, explanationId) }, { headers: noStore });
    }
    if (request.method === "POST") {
      return Response.json({ feedback: deps.put(userId, await readJson(request)) }, { headers: noStore });
    }
    return Response.json({ error: "Método no permitido." }, { status: 405, headers: noStore });
  } catch (error) { return apiError(error); }
}
