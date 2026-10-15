export type CorrectionApproval = {
  reviewer: string;
  approvedAt: string;
  evidence: string;
};

export type CorrectionExplanation =
  | { status: "approved"; explanation: string }
  | { status: "pending-review"; explanation: null };

// El banco de demostración no aporta aprobaciones. Una respuesta correcta puede
// mostrarse sin presentar una justificación provisional como revisión docente.
export function correctionExplanation(text: string, approval: CorrectionApproval | null): CorrectionExplanation {
  const explanation = text.trim();
  if (!explanation || !approval?.reviewer.trim() || !approval.evidence.trim() ||
      !Number.isFinite(Date.parse(approval.approvedAt))) {
    return { status: "pending-review", explanation: null };
  }
  return { status: "approved", explanation };
}
