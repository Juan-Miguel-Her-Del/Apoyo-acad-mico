import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { topics, subjects } from "../src/lib/catalog.ts";
import { getStudyDemo } from "../src/lib/study-demo.ts";
import { getDiagnostic, evaluateDemoAnswer } from "../src/lib/diagnostic.ts";
import { getPracticeBank } from "../src/lib/practice.ts";

const pilotIds = ["G05-MAT", "G05-ESP", "G10-MAT", "G10-ESP", "G10-FIS", "G10-QUI"];
const root = fileURLToPath(new URL("../../", import.meta.url));
const output = join(root, "docs", "28-paquete-revision-docente-piloto.html");
const sourceCommit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const date = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", year: "numeric", month: "long", day: "numeric" }).format(new Date());

function html(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function questionBlock({ id, prompt, options, correctOptionId, explanation, skill, difficulty }, index) {
  const choices = options.map((option) => `<li><strong>${html(option.id.toUpperCase())}.</strong> ${html(option.text)}</li>`).join("");
  const correct = options.find((option) => option.id === correctOptionId);
  if (!correct) throw new Error(`Pregunta ${id} sin respuesta en las opciones`);
  return `<article class="question">
    <div class="question-heading"><strong>${index}. ${html(prompt)}</strong><span>${html(id)}</span></div>
    <p class="meta">${skill ? `Subtema: ${html(skill)} · ` : ""}${difficulty ? `Nivel: ${html(difficulty)}` : ""}</p>
    <ol class="choices">${choices}</ol>
    <p><strong>Clave:</strong> ${html(correctOptionId.toUpperCase())} — ${html(correct.text)}</p>
    <p><strong>Justificación propuesta:</strong> ${html(explanation)}</p>
  </article>`;
}

function topicSection(id) {
  const topic = topics.find((item) => item.id === id);
  if (!topic) throw new Error(`Tema ausente: ${id}`);
  const subject = subjects.find((item) => item.id === topic.subjectId);
  const grade = Number(topic.gradeId.slice(1));
  const lesson = getStudyDemo(topic.gradeId, topic.subjectId, topic.id);
  const diagnostic = getDiagnostic(topic.gradeId, topic.subjectId, topic.id, "demo");
  const practice = getPracticeBank(topic.gradeId, topic.subjectId, topic.id);
  if (!subject || !lesson || diagnostic.status !== 200 || diagnostic.questions.length !== 2 || practice?.length !== 6) {
    throw new Error(`Paquete incompleto para ${id}`);
  }
  const diagnosticQuestions = diagnostic.questions.map((item) => {
    const answer = evaluateDemoAnswer(topic.gradeId, topic.subjectId, topic.id, item.id, item.options[0].id);
    if (answer.status !== 200) throw new Error(`No se puede evaluar ${item.id}`);
    return { ...item, correctOptionId: answer.correctOptionId, explanation: answer.explanation, difficulty: "Inicial" };
  });
  const shortAnswer = lesson.question.options[lesson.question.correctIndex];
  return `<section class="topic">
    <div class="topic-kicker">${html(id)} · ${grade}.º · ${html(subject.name)}</div>
    <h2>${html(topic.name)}</h2>
    <p><strong>Referencia DBA candidata:</strong> ${html(topic.dba ?? "Sin referencia propuesta")}. Solicitud al docente: confirmar grado, número, versión y correspondencia con este contenido.</p>
    <div class="lesson"><h3>Explicación y ejemplo actuales</h3>
      <p><strong>Explicación:</strong> ${html(lesson.explanation)}</p>
      <p><strong>Ejemplo:</strong> ${html(lesson.example)}</p>
      <p><strong>Pregunta breve de demostración:</strong> ${html(lesson.question.prompt)}<br>
      <strong>Respuesta exacta usada actualmente:</strong> ${html(shortAnswer)}<br>
      <strong>Comentario actual:</strong> ${html(lesson.question.feedback)}</p>
      <p class="caution">Esta pregunta breve reutiliza una opción de selección múltiple. Se necesita una pregunta y solución de referencia revisadas para el flujo estudiantil.</p>
    </div>
    <h3>Diagnóstico de vista previa · 2 preguntas</h3>
    ${diagnosticQuestions.map((question, index) => questionBlock(question, index + 1)).join("")}
    <h3>Banco de práctica · 6 preguntas</h3>
    <p class="meta">El diagnóstico adaptativo de cuenta adulta reutiliza estas seis preguntas. La pregunta 1 coincide en enunciado con la pregunta breve de demostración.</p>
    ${practice.map((question, index) => questionBlock({ ...question, skill: question.skillId, difficulty: question.difficulty }, index + 1)).join("")}
    <div class="review"><h3>Dictamen para ${html(id)}</h3>
      <p>☐ Tema y DBA adecuados &nbsp; ☐ Explicación y ejemplo correctos &nbsp; ☐ Claves y justificaciones correctas &nbsp; ☐ Vocabulario apropiado para ${grade}.º</p>
      <p>Resultado: ☐ Aprobado &nbsp; ☐ Aprobado con cambios &nbsp; ☐ Pendiente / no aprobar</p>
      <p>Correcciones o contenido adicional necesario (segundo ejemplo y pregunta breve con solución):</p>
      <div class="writing"></div><div class="writing"></div>
      <p>Docente: __________________________ &nbsp; Materia/experiencia: __________________________</p>
      <p>Fecha: __________________________ &nbsp; Versión revisada: __________________________</p>
    </div>
  </section>`;
}

const document = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Apoyo_academico — paquete de revisión docente piloto</title>
<style>
@page{size:A4;margin:17mm 17mm 18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#192337;font-size:10.5pt;line-height:1.4;margin:0}h1{font-size:22pt;line-height:1.12;margin:0 0 10mm}h2{font-size:17pt;margin:2mm 0 6mm;color:#143976}h3{font-size:12pt;color:#143976;margin:8mm 0 3mm}p{margin:2.5mm 0}li{margin:1mm 0}.cover{page-break-after:always}.eyebrow,.topic-kicker{font-weight:700;color:#245497;letter-spacing:.04em;text-transform:uppercase}.eyebrow{margin:7mm 0}.summary{padding:5mm;background:#eaf1fa;border-left:4px solid #245497;margin:7mm 0}.caution{color:#7a3c00;background:#fff5e7;padding:2mm 3mm}.topic{page-break-before:always}.topic-kicker{font-size:9pt}.lesson{padding:3mm 4mm;background:#f3f6fa;border:1px solid #dce6f2}.lesson h3{margin:1mm 0 2mm}.question{break-inside:avoid;border-bottom:1px solid #d9e0ea;padding:3mm 0}.question p{margin:1mm 0}.question-heading{display:flex;gap:4mm;justify-content:space-between}.question-heading strong{flex:1}.question-heading span,.meta{font-size:8.5pt;color:#516078}.choices{margin:2mm 0;padding-left:7mm}.review{break-inside:avoid;border:2px solid #245497;padding:4mm;margin-top:7mm}.review h3{margin:0 0 3mm}.writing{height:8mm;border-bottom:1px solid #aebbd0}@media screen{body{max-width:900px;margin:auto;padding:32px}.cover{min-height:800px}.topic{border-top:3px solid #245497;padding-top:20px}}
</style></head><body>
<section class="cover"><p class="eyebrow">Apoyo_academico · revisión curricular</p><h1>Seis combinaciones piloto<br>Paquete para revisión docente</h1>
<p>Generado el ${html(date)} a partir del código en commit <code>${html(sourceCommit)}</code>.</p>
<div class="summary"><strong>Contenido provisional, sin aprobación docente.</strong> Incluye seis temas, seis explicaciones y ejemplos, doce preguntas diagnósticas de vista previa y treinta y seis preguntas de práctica. Las claves se muestran aquí para revisión; la app no las entrega en la consulta pública.</div>
<h2>Cómo revisar</h2><ol>
<li>Comprueba que el tema y la referencia DBA candidata correspondan al grado y a la materia. Añade la referencia exacta o corrige la propuesta.</li>
<li>Lee explicación y ejemplo; corrige exactitud, claridad y dificultad del lenguaje.</li>
<li>Para cada pregunta, verifica enunciado, opciones, única clave correcta, subtema, nivel y justificación. Señala duplicados o preguntas ambiguas.</li>
<li>Indica si apruebas cada combinación, qué debe corregirse y qué contenido adicional falta. Para los ejemplos alternativos y la pregunta breve publicada aún se requieren textos y soluciones revisados.</li>
<li>Devuelve este PDF anotado, o una tabla con ID de tema/pregunta, decisión, observación, tu nombre, área de competencia, fecha y versión revisada. La aprobación debe identificar la versión exacta; no se publicará por una confirmación verbal general.</li></ol>
<p><strong>Alcance:</strong> G05-MAT, G05-ESP, G10-MAT, G10-ESP, G10-FIS y G10-QUI. Los otros veinte temas están en AP-316 y no están incluidos en este archivo.</p>
<p><strong>Origen:</strong> catálogo, lecciones y bancos de demostración de <code>web/src/lib/</code>. Este paquete no afirma que las referencias DBA ya estén verificadas ni que el banco sea suficiente para medir dominio académico. El diagnóstico adaptativo de cuenta adulta reutiliza el banco de práctica.</p>
</section>
${pilotIds.map(topicSection).join("\n")}
</body></html>`;
writeFileSync(output, document, "utf8");
console.log(`Paquete generado: ${output} (6 temas, 12 preguntas diagnósticas, 36 de práctica)`);
