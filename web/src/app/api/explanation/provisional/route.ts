import { noStore } from "@/lib/auth-http";
import { geminiExplanationProvider } from "@/lib/explanation-gemini";
import { handleProvisionalExplanationRequest } from "@/lib/provisional-explanation-http";

export const runtime = "nodejs";

let windowStart = 0;
let requestsInWindow = 0;
function consumeDemoQuota() {
  const now = Date.now();
  if (now - windowStart >= 60 * 60 * 1000) { windowStart = now; requestsInWindow = 0; }
  if (requestsInWindow >= 30) return false;
  requestsInWindow += 1;
  return true;
}

function enabled() {
  return process.env.APOYO_ENABLE_PROVISIONAL_AI === "true" && Boolean(process.env.GEMINI_API_KEY);
}

export async function GET() {
  return Response.json({ available: enabled() }, { headers: noStore });
}

export async function POST(request: Request) {
  return handleProvisionalExplanationRequest(request, {
    enabled: enabled(), provider: geminiExplanationProvider, consumeQuota: consumeDemoQuota,
  });
}
