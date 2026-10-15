import { openStudentAccountStore } from "@/lib/student-accounts";
import { handleStudentRegistration } from "@/lib/student-registration-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStudentRegistration(request, {
    // AP-304: completar solo tras aprobar aviso, política y verificador del representante.
    reviewedPolicy: null,
    verifyRepresentative: null,
    openStore: (policy) => openStudentAccountStore(undefined, policy),
  });
}
