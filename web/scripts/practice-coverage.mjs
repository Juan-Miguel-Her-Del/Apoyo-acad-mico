import { topics } from "../src/lib/catalog.ts";
import { PRACTICE_BANK_VERSION, practiceBankCoverage } from "../src/lib/practice.ts";

const rows = topics.filter((topic) => topic.active && topic.pilotCandidate)
  .map((topic) => practiceBankCoverage(topic.gradeId, topic.subjectId, topic.id));
console.log(`Cobertura del banco de práctica ${PRACTICE_BANK_VERSION} (provisional; 0 preguntas revisadas por docente)`);
console.log("Tema       Total  Nivel 1  Nivel 2  Estado");
for (const row of rows) {
  console.log(`${row.topicId.padEnd(10)} ${String(row.total).padStart(5)}  ${String(row.byDifficulty[1]).padStart(7)}  ${String(row.byDifficulty[2]).padStart(7)}  ${row.sufficientForTwoDistinctRounds ? "SUFICIENTE" : "INSUFICIENTE"}`);
}
const insufficient = rows.filter((row) => !row.sufficientForTwoDistinctRounds);
console.log(`Temas: ${rows.length}; suficientes para dos rondas distintas: ${rows.length - insufficient.length}; insuficientes: ${insufficient.length}.`);
if (insufficient.length) process.exitCode = 1;
