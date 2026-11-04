import { emailVerificationConfigured } from "@/lib/email-verification-delivery";
import { noStore } from "@/lib/auth-http";

export function GET() {
  return Response.json({ configured: emailVerificationConfigured() }, { headers: noStore });
}
