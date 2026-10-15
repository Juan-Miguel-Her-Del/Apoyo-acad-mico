import { authStore } from "@/lib/auth";
import { requestToken } from "@/lib/auth-http";
import { diagnosticAttemptStore } from "@/lib/diagnostic-attempts";
import { handleExplanationRequest } from "@/lib/explanation-http";
import { configuredExplanationProvider } from "@/lib/explanation-provider";
import { getReviewedExplanationSource } from "@/lib/explanation-sources";
import { explanationReviewStore } from "@/lib/explanation-review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleExplanationRequest(request, {
    userId: (incoming) => authStore().sessionUser(requestToken(incoming))?.id ?? null,
    attempt: (userId, attemptId) => diagnosticAttemptStore().get(userId, attemptId),
    source: getReviewedExplanationSource,
    provider: configuredExplanationProvider,
    review: (event) => explanationReviewStore().record(event),
  });
}
