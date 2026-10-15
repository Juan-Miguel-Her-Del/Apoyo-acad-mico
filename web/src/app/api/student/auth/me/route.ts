import { createStudentAuthHandlers } from "@/lib/student-auth-http";

export const runtime = "nodejs";
export const GET = createStudentAuthHandlers(null).me;
