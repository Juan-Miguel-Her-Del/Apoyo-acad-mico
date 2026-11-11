import { authStore } from "@/lib/auth";
import { requestToken } from "@/lib/auth-http";
import { explanationReviewStore } from "@/lib/explanation-review";
import { handleProvisionalExplanationReport } from "@/lib/provisional-explanation-report-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleProvisionalExplanationReport(request, {
    authenticated: async (value) => !!(await authStore().sessionUser(requestToken(value))),
    record: (event) => explanationReviewStore().record(event),
  });
}
