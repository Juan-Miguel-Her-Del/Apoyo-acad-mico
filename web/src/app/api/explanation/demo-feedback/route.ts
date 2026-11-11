import { authStore } from "@/lib/auth";
import { requestToken } from "@/lib/auth-http";
import { demoFeedbackStore } from "@/lib/explanation-demo-feedback";
import { handleDemoFeedback } from "@/lib/explanation-demo-feedback-http";

export const runtime = "nodejs";

function dependencies() {
  const store = demoFeedbackStore();
  return {
    userId: async (request: Request) => (await authStore().sessionUser(requestToken(request)))?.id ?? null,
    get: store.get,
    put: store.put,
  };
}

export async function GET(request: Request) { return handleDemoFeedback(request, dependencies()); }
export async function POST(request: Request) { return handleDemoFeedback(request, dependencies()); }
