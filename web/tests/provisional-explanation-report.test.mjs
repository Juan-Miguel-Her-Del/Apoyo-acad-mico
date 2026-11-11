import test from "node:test";
import assert from "node:assert/strict";
import { getDiagnostic } from "../src/lib/diagnostic.ts";
import { handleProvisionalExplanationReport } from "../src/lib/provisional-explanation-report-http.ts";
import { STUDY_SOURCE_VERSION } from "../src/lib/provisional-explanation.ts";

test("un reporte autenticado conserva solo metadatos curriculares y rechaza temas ajenos", async (t) => {
  const previous = process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
  process.env.APOYO_ENABLE_ADULT_ACCOUNTS = "true";
  t.after(() => { if (previous === undefined) delete process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
    else process.env.APOYO_ENABLE_ADULT_ACCOUNTS = previous; });
  const skill = getDiagnostic("G05", "MAT", "G05-MAT", "demo").questions[0].skill;
  const events = [];
  const deps = { authenticated: () => true, record: (event) => events.push(event) };
  const request = (topicId, reason = "inaccurate", exampleIndex = 0) => new Request("http://localhost:3000/api/explanation/report", {
    method: "POST", headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ gradeId: "G05", subjectId: "MAT", topicId, subskillId: skill,
      sourceVersion: STUDY_SOURCE_VERSION, reason, exampleIndex }),
  });
  assert.equal((await handleProvisionalExplanationReport(request("G05-MAT"), deps)).status, 200);
  assert.deepEqual(events, [{ topicId: "G05-MAT", subskillId: skill, sourceVersion: STUDY_SOURCE_VERSION,
    exampleIndex: 0, reason: "reported_inaccurate" }]);
  assert.equal((await handleProvisionalExplanationReport(request("G05-MAT", "confusing", 1), deps)).status, 200);
  assert.deepEqual(events[1], { topicId: "G05-MAT", subskillId: skill,
    sourceVersion: STUDY_SOURCE_VERSION, exampleIndex: 1, reason: "reported_confusing" });
  assert.equal((await handleProvisionalExplanationReport(request("G05-ESP"), deps)).status, 400);
  assert.equal((await handleProvisionalExplanationReport(request("G05-MAT", "other"), deps)).status, 400);
  assert.equal((await handleProvisionalExplanationReport(request("G05-MAT", "confusing", 2), deps)).status, 400);
  assert.equal((await handleProvisionalExplanationReport(request("G05-MAT"), { ...deps, authenticated: () => false })).status, 401);
  assert.equal(events.length, 2);
});
