import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { openAuthStore } from "../src/lib/auth.ts";

const browser = process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "google-chrome");
const baseUrl = process.env.BROWSER_TEST_URL ?? "http://localhost:3100";
const profile = mkdtempSync(join(tmpdir(), "ap-sprint1-browser-"));
const chrome = spawn(browser, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "about:blank",
], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let browserError = "";
chrome.stderr.on("data", (chunk) => { browserError += chunk.toString().slice(0, 1000); });

async function waitFor(check, message, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await check();
    if (result) return result;
    await new Promise((done) => setTimeout(done, 80));
  }
  throw new Error(`Tiempo agotado: ${message}`);
}

let socket;
try {
  const portFile = join(profile, "DevToolsActivePort");
  const port = await waitFor(() => existsSync(portFile) && readFileSync(portFile, "utf8").split("\n")[0], `Chrome DevTools: ${browserError}`);
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = pages.find((page) => page.type === "page");
  assert.ok(target, "Chrome debe tener una página");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("close", () => {
    for (const { reject } of pending.values()) reject(new Error(`Chrome cerró DevTools: ${browserError}`));
    pending.clear();
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { done, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else done(message.result);
  });
  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((done, reject) => {
      pending.set(id, { done, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  }
  let navigationCount = 0;
  async function navigate() {
    await send("Page.navigate", { url: `${baseUrl}/?smoke=${++navigationCount}` });
    await waitFor(() => evaluate("document.readyState === 'complete'"), "carga de página");
  }
  async function waitText(selector, fragment) {
    if (selector === ".grade-groups") {
      await waitFor(() => evaluate("document.querySelector('.route-steps button') !== null"), "navegación de estudio");
      if (!await evaluate("document.querySelector('.grade-groups') !== null")) await evaluate("document.querySelector('.route-steps button').click()");
    }
    try {
      return await waitFor(
        () => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.includes(${JSON.stringify(fragment)})`),
        `${selector} contiene ${fragment}`,
      );
    } catch (error) {
      console.error("URL:", await evaluate("location.href"));
      console.error("Pantalla:", await evaluate("document.body?.innerText?.slice(0, 1200)"));
      throw error;
    }
  }
  async function click(selector, fragment) {
    if (selector === ".grade-choice" || selector === ".subject-choice" || selector === ".topic-choice") {
      const index = selector === ".grade-choice" ? 0 : selector === ".subject-choice" ? 1 : 2;
      if (!await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`)) {
        await evaluate(`document.querySelectorAll('.route-steps button')[${index}]?.click()`);
        await waitFor(() => evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`), `paso ${selector}`);
      }
    }
    if (selector.startsWith(".account-deletion")) {
      await evaluate("[...document.querySelectorAll('.main-nav button')].find((item) => item.textContent === 'Cuenta')?.click()");
      await evaluate("[...document.querySelectorAll('.account-panel .text-button')].find((item) => item.textContent.includes('Datos y seguridad'))?.click()");
      await waitFor(() => evaluate("document.querySelector('.account-deletion') !== null"), "gestión de cuenta");
    }
    const expression = `[...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.includes(${JSON.stringify(fragment)}))?.click()`;
    await evaluate(expression);
  }
  async function finishLesson() {
    await waitText(".chapter-progress", "Parte 1 de 3");
    await click(".study-screen .primary-button", "Siguiente parte");
    await waitText(".chapter-progress", "Parte 2 de 3");
    await click(".study-screen .primary-button", "Siguiente parte");
    await waitText(".chapter-progress", "Parte 3 de 3");
    await click(".study-screen .primary-button", "Comprobar lo aprendido");
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await navigate();
  await waitText(".welcome-intro", "Estudia a tu ritmo");
  assert.equal(await evaluate("document.querySelector('.grade-choice, .main-nav') === null"), true, "la bienvenida aparece antes del contenido");
  await click(".account-tabs button", "Crear cuenta");
  await waitText(".policy-preview", "política de datos y los términos");
  await evaluate(`(() => { const inputs = document.querySelectorAll('.account-panel form input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[0], 'perfil@example.test'); inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(inputs[1], 'Clave-segura-1234'); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await click(".account-panel form .primary-button", "Continuar al perfil");
  await waitText(".account-panel form", "Paso 2 de 2");
  assert.equal(await evaluate("document.querySelector('.account-panel form select') !== null"), true);
  await click(".welcome-intro button", "Explorar una vista previa");
  assert.equal(await evaluate("document.querySelectorAll('.main-nav button').length"), 3);
  await click(".main-nav button", "Mi progreso");
  await waitText(".progress-gate", "Entra para ver tu progreso");
  assert.equal(await evaluate("document.querySelector('.grade-groups')?.closest('[hidden]') !== null"), true);
  await click(".progress-gate button", "Ir a mi cuenta");
  await waitText(".account-panel", "Iniciar sesión");
  await click(".account-tabs button", "Crear cuenta");
  await waitText(".policy-preview", "política de datos y los términos");
  const mailConfigured = await evaluate("fetch('/api/auth/email-status').then((response) => response.json()).then((body) => body.configured)");
  if (!mailConfigured) await waitText(".account-panel", "envío de correos de confirmación aún no está configurado");
  await click(".account-type-choice button", "menor de 18");
  await waitText(".student-account-gate", "registro real de menores sigue cerrado");
  assert.equal(await evaluate("document.querySelector('.account-panel form') === null"), true);
  await click(".student-account-gate button", "Crear perfil ficticio de prueba");
  await waitText(".demo-profile-picker", "Perfiles ficticios de estudiantes");
  await evaluate("document.querySelector('.demo-create select').value = 'G05'; document.querySelector('.demo-create select').dispatchEvent(new Event('change', { bubbles: true }))");
  await click(".demo-create button", "Crear perfil ficticio");
  await waitText(".demo-study-flow", "Perfil ficticio 1");
  assert.equal(await evaluate("document.querySelector('.demo-study-flow .grade-choice') === null"), true, "el grado ficticio queda fijo en su perfil");
  await click(".demo-study-flow .subject-choice", "Matemáticas");
  await click(".demo-study-flow .topic-choice", "Problemas con fracciones");
  await click(".diagnostic-card .primary-button", "Empezar a estudiar");
  await waitText(".diagnostic-panel", "Antes de comenzar");
  await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
  for (let index = 0; index < 2; index += 1) {
    await waitText(".question-progress", `Pregunta ${index + 1} de 2`);
    await evaluate("document.querySelector('.diagnostic-panel .answer-option input').click()");
    await click(".diagnostic-panel .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.answer-feedback .primary-button') !== null"), "respuesta del perfil ficticio");
    await click(".answer-feedback .primary-button", index === 0 ? "Siguiente pregunta" : "Ver resumen");
  }
  await click(".main-nav button", "Mi progreso");
  await waitText(".demo-progress", "Problemas con fracciones");
  await waitText(".demo-progress", "No hay fortalezas observadas todavía");
  await click(".main-nav button", "Perfil");
  await click(".demo-profile-details button", "Cambiar de perfil");
  await click(".demo-profile-list button", "Perfil ficticio 1");
  await click(".main-nav button", "Mi progreso");
  await waitText(".demo-progress", "Problemas con fracciones");
  await click(".main-nav button", "Perfil");
  await click(".demo-profile-details button", "Borrar este perfil ficticio");
  await waitText(".demo-profile-picker", "Perfiles ficticios de estudiantes");
  assert.equal(await evaluate("localStorage.getItem('apoyo-perfiles-ficticios-v1')"), "[]");
  await evaluate("document.querySelector('.demo-create select').value = 'G10'; document.querySelector('.demo-create select').dispatchEvent(new Event('change', { bubbles: true }))");
  await click(".demo-create button", "Crear perfil ficticio");
  await click(".demo-study-flow .subject-choice", "Matemáticas");
  await click(".demo-study-flow .topic-choice", "Razones y funciones trigonométricas");
  await click(".diagnostic-card .primary-button", "Empezar a estudiar");
  await waitText(".diagnostic-panel", "Antes de comenzar");
  await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
  for (const [index, expected] of ["Cateto opuesto / hipotenusa", "3/5"].entries()) {
    await waitText(".question-progress", `Pregunta ${index + 1} de 2`);
    await evaluate(`[...document.querySelectorAll('.diagnostic-panel .answer-option')].find((item) => item.textContent.includes(${JSON.stringify(expected)}))?.querySelector('input')?.click()`);
    await click(".diagnostic-panel .primary-button", "Revisar respuesta");
    await waitText(".answer-feedback.correct", "Respuesta correcta");
    await click(".answer-feedback .primary-button", index === 0 ? "Siguiente pregunta" : "Ver resumen");
  }
  await click(".main-nav button", "Mi progreso");
  await waitText(".demo-strengths", "razón trigonométrica");
  await click(".main-nav button", "Perfil");
  await click(".demo-profile-details button", "Borrar este perfil ficticio");
  await click(".demo-profile-picker button", "Volver al inicio");
  await click(".main-nav button", "Estudiar");
  const testAccounts = process.env.BROWSER_TEST_ACCOUNTS === "true";
  const testEmail = `demo-${Date.now()}@example.test`;
  const testPassword = "DemoPassword-1234";
  await waitText(".grade-groups", "10.º");
  assert.equal(await evaluate("document.querySelectorAll('.grade-choice:not(:disabled)').length"), 11);
  await click(".grade-choice", "1.º");
  await waitText(".subject-grid", "Matemáticas");
  await click(".subject-choice", "Matemáticas");
  await waitText(".topic-list", "Contar, comparar");
  await click(".topic-choice", "Contar, comparar");
  assert.equal(await evaluate("document.querySelector('.diagnostic-card .primary-button')?.disabled"), false);
  await click(".grade-choice", "10.º");
  await waitText(".subject-grid", "Química");
  assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 4);
  await click(".subject-choice", "Química");
  await waitText(".topic-list", "Reacciones inorgánicas");
  await click(".topic-choice", "Reacciones inorgánicas");
  await waitText(".selection-summary", "Reacciones inorgánicas");
  const published = await fetch(`${baseUrl}/api/diagnostic?grade=G10&subject=QUI&topic=G10-QUI`);
  assert.equal(published.status, 409, "la ruta publicada debe quedar bloqueada");
  const invalid = await fetch(`${baseUrl}/api/diagnostic?mode=demo&grade=G05&subject=QUI&topic=G10-QUI`);
  assert.equal(invalid.status, 400, "el servidor rechaza una combinación cruzada");
  const questionsResponse = await fetch(`${baseUrl}/api/diagnostic?mode=demo&grade=G10&subject=QUI&topic=G10-QUI`);
  const questionsBody = await questionsResponse.json();
  assert.equal(questionsResponse.status, 200);
  assert.equal(questionsBody.questions.length, 2);
  assert.equal("correctOptionId" in questionsBody.questions[0], false, "GET no revela soluciones");
  const badAnswer = await fetch(`${baseUrl}/api/diagnostic`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "demo", gradeId: "G10", subjectId: "QUI", topicId: "G10-QUI", questionId: questionsBody.questions[0].id, optionId: "z" }) });
  assert.equal(badAnswer.status, 400, "POST rechaza opciones inválidas");
  const publishedAnswer = await fetch(`${baseUrl}/api/diagnostic`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "published", gradeId: "G10", subjectId: "QUI", topicId: "G10-QUI", questionId: questionsBody.questions[0].id, optionId: "a" }) });
  assert.equal(publishedAnswer.status, 409, "POST no evalúa modo publicado");
  await click(".diagnostic-card .primary-button", "Empezar a estudiar");
  await waitText(".diagnostic-panel", "Antes de comenzar");
  await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
  await waitText(".question-progress", "Pregunta 1 de 2");
  await click(".main-nav button", "Mi progreso");
  await click(".main-nav button", "Estudiar");
  await waitText(".question-progress", "Pregunta 1 de 2");
  await evaluate("window.__answerPosts = 0; const originalDiagnosticFetch = window.fetch; window.fetch = (...args) => { if (String(args[0]).endsWith('/api/diagnostic') && args[1]?.method === 'POST') window.__answerPosts++; return originalDiagnosticFetch(...args); }");
  await evaluate("document.querySelector('.answer-option input').click()");
  await evaluate("const answerButton = document.querySelector('.diagnostic-panel .primary-button'); answerButton.click(); answerButton.click()");
  await waitText(".answer-feedback", "Respuesta de referencia");
  assert.equal(await evaluate("document.querySelector('.answer-feedback.incorrect strong')?.textContent"), "Respuesta incorrecta");
  assert.equal(await evaluate("window.__answerPosts"), 1, "doble clic envía una sola respuesta");
  await click(".answer-feedback .primary-button", "Siguiente pregunta");
  await waitText(".question-progress", "Pregunta 2 de 2");
  await evaluate("document.querySelector('.answer-option input').click()");
  await click(".diagnostic-panel .primary-button", "Revisar respuesta");
  await waitText(".answer-feedback", "Respuesta de referencia");
  assert.equal(await evaluate("document.querySelector('.answer-feedback.correct strong')?.textContent"), "Respuesta correcta");
  await click(".answer-feedback .primary-button", "Ver resumen");
  await waitText(".diagnostic-panel", "Terminaste la demostración");
  assert.equal(await evaluate("document.querySelector('.diagnostic-panel').textContent.includes('Respondiste 2 de 2')"), true);
  assert.equal(await evaluate("document.querySelectorAll('.skill-results li').length"), 2, "cada subtema de Química conserva su trazabilidad");
  assert.equal(await evaluate("[...document.querySelectorAll('.skill-results li')].every((item) => item.textContent.includes('indeterminado'))"), true, "una sola respuesta por subtema no permite inferir dificultad");
  console.log("OK: HTTP demo/publicado, respuestas válidas, doble clic, avance y resultado solo en memoria.");
  await click(".subject-choice", "Matemáticas");
  await waitText(".topic-list", "Razones y funciones");
  await click(".topic-choice", "Razones y funciones");
  await click(".diagnostic-card .primary-button", "Empezar a estudiar");
  await waitText(".diagnostic-panel", "Antes de comenzar");
  await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
  await waitText(".question-progress", "Pregunta 1 de 2");
  await evaluate("document.querySelectorAll('.answer-option input')[1].click()");
  await click(".diagnostic-panel .primary-button", "Revisar respuesta");
  await waitText(".answer-feedback", "Respuesta de referencia");
  await click(".answer-feedback .primary-button", "Siguiente pregunta");
  await waitText(".question-progress", "Pregunta 2 de 2");
  await evaluate("document.querySelectorAll('.answer-option input')[0].click()");
  await click(".diagnostic-panel .primary-button", "Revisar respuesta");
  await waitText(".answer-feedback", "Respuesta de referencia");
  await click(".answer-feedback .primary-button", "Ver resumen");
  await waitText(".skill-results", "señal de dificultad (demo)");
  assert.equal(await evaluate("document.querySelector('.skill-results li').textContent.includes('0/2 aciertos; preguntas 1, 2')"), true);
  await click(".diagnostic-panel .primary-button", "Continuar a estudiar");
  await waitText(".study-screen", "Explicación");
  await finishLesson();
  await waitText(".quick-practice", "Elige una respuesta");
  await evaluate("document.querySelector('.quick-practice .answer-option input').click()");
  await click(".quick-practice .primary-button", "Revisar respuesta");
  await waitText(".quick-practice .answer-feedback", "¡Correcto!");
  if (testAccounts) {
    const fixtureStore = openAuthStore();
    await fixtureStore.register({ email: testEmail, password: testPassword, adultConfirmed: true });
    fixtureStore.close();
    const loginStatus = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(testEmail)}, password: ${JSON.stringify(testPassword)} }) }).then((response) => response.status)`);
    assert.equal(loginStatus, 200, "una cuenta existente debe poder iniciar sesión");
    await navigate();
    await waitFor(async () => {
      await click(".main-nav button", "Cuenta");
      return evaluate("document.querySelector('.profile-setup') !== null");
    }, "vista de cuenta tras iniciar sesión");
    await waitText(".profile-setup", "Prepara tu perfil");
    await waitFor(() => evaluate("document.querySelector('.profile-setup input') !== null"), "formulario de perfil");
    await evaluate(`(() => { const input = document.querySelector('.profile-setup input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Cuenta de prueba'); input.dispatchEvent(new Event('input', { bubbles: true }));
      const grade = document.querySelector('.profile-setup select'); grade.value = 'G10'; grade.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await click(".profile-setup .primary-button", "Guardar y elegir materia");
    await waitText(".subject-grid", "Matemáticas");
    assert.equal(await evaluate("fetch('/api/profile').then((response) => response.json()).then((body) => body.profile?.gradeId)"), "G10");
    assert.equal(await evaluate("document.querySelectorAll('.grade-choice').length"), 0, "el grado del perfil no se elige en Estudiar");
    await waitText(".profile-grade-banner", "10.º");
    const wrongGradeSelection = await evaluate("fetch('/api/selection', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId: 'G05', subjectId: 'MAT', topicId: 'G05-MAT' }) }).then((response) => response.status)");
    assert.equal(wrongGradeSelection, 403, "la selección de otro grado se rechaza en el servidor");
    const wrongGradePractice = await evaluate("fetch('/api/practice/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId: 'G05', subjectId: 'MAT', topicId: 'G05-MAT' }) }).then((response) => response.status)");
    assert.equal(wrongGradePractice, 403, "la práctica de otro grado se rechaza en el servidor");
    const wrongGradeDiagnostic = await evaluate("fetch('/api/diagnostic/attempt/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId: 'G05', subjectId: 'MAT', topicId: 'G05-MAT', mode: 'demo' }) }).then((response) => response.status)");
    assert.equal(wrongGradeDiagnostic, 403, "el diagnóstico de otro grado se rechaza en el servidor");
    async function completeAccountDiagnostic(subject, topic) {
      await navigate();
      await waitText(".account-panel", testEmail);
      await click(".main-nav button", "Estudiar");
      await click(".route-steps button", "1. Materia");
      await waitText(".subject-grid", subject);
      await click(".subject-choice", subject);
      await waitText(".topic-list", topic);
      await click(".topic-choice", topic);
      await click(".diagnostic-card .primary-button", "Empezar a estudiar");
      for (let questionNumber = 1; questionNumber <= 4; questionNumber += 1) {
        await waitText(".diagnostic-account-attempt .question-progress", `Pregunta ${questionNumber} de 4`);
        await evaluate("document.querySelector('.diagnostic-account-attempt .answer-option input').click()");
        await click(".diagnostic-account-attempt .primary-button", "Revisar respuesta");
        await waitText(".diagnostic-account-attempt .answer-feedback", "Explicación pendiente de revisión docente");
        await click(".diagnostic-account-attempt .answer-feedback .primary-button", questionNumber === 4 ? "Ver resumen" : "Siguiente pregunta");
      }
      await waitText(".diagnostic-account-attempt", "Terminaste la demostración");
      await click(".main-nav button", "Mi progreso");
      await click(".screen-card-grid button", "Diagnósticos");
      await waitText(".progress-detail-screen", topic);
      await click(".screen-back", "Volver a mi progreso");
      await click(".main-nav button", "Estudiar");
    }
    await completeAccountDiagnostic("Química", "Reacciones inorgánicas");
    await completeAccountDiagnostic("Matemáticas", "Razones y funciones");
    await click(".diagnostic-account-attempt .primary-button", "Continuar a estudiar");
    await waitText(".study-screen", "Explicación");
    await finishLesson();
    await waitText(".explanation-followup", "Comprueba lo que entendiste");
    await click(".study-screen .primary-button", "Ir a la práctica");
    await click(".practice-session .primary-button", "Empezar práctica de dos preguntas");
    await waitText(".practice-session .question-progress", "Pregunta 1 de 2");
    await evaluate("document.querySelector('.practice-session .answer-option input').click()");
    await click(".practice-session .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.practice-session .answer-feedback') !== null"), "respuesta de práctica 1");
    await click(".practice-session .answer-feedback .primary-button", "Siguiente pregunta");
    await waitText(".practice-session .question-progress", "Pregunta 2 de 2");
    const invalidPractice = await evaluate("fetch('/api/practice/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: localStorage.getItem('apoyo-practice:G10-MAT'), questionId: document.querySelector('.practice-session .answer-option input').name, optionId: 'z' }) }).then((response) => response.status)");
    assert.equal(invalidPractice, 400, "opción inválida no debe registrar una respuesta");
    await evaluate("document.querySelector('.practice-session .answer-option input').click()");
    await click(".practice-session .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.practice-session .answer-feedback') !== null"), "respuesta de práctica 2");
    await click(".practice-session .answer-feedback .primary-button", "Ver resultado");
    await waitText(".practice-result", "Práctica terminada");
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Evolución");
    await waitText(".domain-summary", "Indeterminado");
    assert.equal(await evaluate("document.querySelectorAll('.skill-overview li').length"), 2);
    assert.equal(await evaluate("document.querySelectorAll('.progress-bars li').length"), 1);
    await click(".screen-back", "Volver a mi progreso");
    await click(".main-nav button", "Estudiar");
    const closedPractice = await evaluate("fetch('/api/practice/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: localStorage.getItem('apoyo-practice:G10-MAT'), questionId: 'practice-g10-mat-02', optionId: 'a' }) }).then((response) => response.status)");
    assert.equal(closedPractice, 409, "una sesión terminada no debe cambiar de resultado");
    const forgedStudy = await evaluate("fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId: 'G10', subjectId: 'MAT', topicId: 'G10-MAT', kind: 'study', completed: true }) }).then((response) => response.status)");
    assert.equal(forgedStudy, 400, "el avance de práctica no puede declararse desde el cliente");
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Prácticas");
    await waitText(".progress-detail-screen", "Razones y funciones trigonométricas");
    await click(".screen-back", "Volver a mi progreso");
    await click(".main-nav button", "Estudiar");
    await click(".practice-result .text-button", "Iniciar otra ronda");
    await waitText(".practice-session .question-progress", "Pregunta 1 de 2");
    await waitText(".practice-question", "Nivel de esta pregunta: 2");
    await evaluate("document.querySelector('.practice-session .answer-option input').click()");
    await click(".practice-session .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.practice-session .answer-feedback') !== null"), "respuesta de segunda ronda 1");
    await click(".practice-session .answer-feedback .primary-button", "Siguiente pregunta");
    await waitText(".practice-session .question-progress", "Pregunta 2 de 2");
    await evaluate("document.querySelector('.practice-session .answer-option input').click()");
    await click(".practice-session .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.practice-session .answer-feedback') !== null"), "respuesta de segunda ronda 2");
    await click(".practice-session .answer-feedback .primary-button", "Ver resultado");
    await waitText(".practice-result", "Práctica terminada");
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Evolución");
    await waitFor(() => evaluate("document.querySelectorAll('.progress-bars li').length === 2"), "dos puntos de progreso del subtema");
    assert.equal(await evaluate("document.querySelector('.domain-summary').textContent.includes('Indeterminado')"), false);
    await click(".screen-back", "Volver a mi progreso");
    await click(".main-nav button", "Estudiar");
    await click(".practice-result .text-button", "Iniciar otra ronda");
    await waitText(".practice-session .question-progress", "Pregunta 1 de 2");
    await click(".practice-session > .text-button", "Terminar práctica ahora");
    await waitText(".practice-result", "sin respuestas");
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Prácticas");
    await waitText(".progress-detail-screen", "terminada sin respuestas");
    await waitFor(() => evaluate("document.querySelector('.comparison-result') !== null"), "comparación de dos rondas respondidas");
    const guestStatus = await evaluate("fetch('/api/auth/logout', { method: 'POST' }).then((response) => response.status)");
    assert.equal(guestStatus, 200);
    await navigate();
    await click(".welcome-intro button", "Explorar una vista previa");
  }
  console.log("OK: dos respuestas del mismo subtema muestran señal demo con preguntas trazables.");
  await click(".grade-choice", "5.º");
  await waitText(".subject-grid", "Español");
  assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 2);
  assert.equal(await evaluate("document.querySelector('.selection-summary')?.textContent.includes('Reacciones inorgánicas') ?? false"), false);
  assert.equal(await evaluate("document.querySelector('.diagnostic-panel') === null"), true, "cambiar grado reinicia el intento");
  await click(".subject-choice", "Español");
  await waitText(".topic-list", "Planear y producir");
  await click(".topic-choice", "Planear y producir");
  await waitText(".selection-summary", "Planear y producir");
  await click(".subject-choice", "Matemáticas");
  await waitText(".topic-list", "Problemas con fracciones");
  assert.equal(await evaluate("document.querySelector('.selection-summary')?.textContent.includes('Planear y producir') ?? false"), false);
  console.log("OK: navegación G10-QUI → G05-ESP → G05-MAT; limpieza de selecciones.");

  async function scenario(source, run) {
    const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", { source });
    try {
      await navigate();
      await waitFor(() => evaluate("document.querySelector('.welcome-intro button, .main-nav button') !== null"), "pantalla inicial");
      if (await evaluate("document.querySelector('.welcome-intro button') !== null")) {
        await click(".welcome-intro button", "Explorar una vista previa");
      }
      await run();
    } finally {
      await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    }
  }

  await scenario(`(() => { const original = window.fetch.bind(window); let failOnce = true;
    window.fetch = async (url, options) => {
      if (String(url).includes("/api/diagnostic?mode=demo")) {
        const response = await original(url, options);
        const body = await response.json();
        return new Response(JSON.stringify({ ...body, questions: body.questions.slice(0, 1) }), { status: response.status });
      }
      if (String(url).endsWith("/api/diagnostic") && options?.method === "POST" && failOnce) {
        failOnce = false;
        throw new Error("Fallo simulado al evaluar");
      }
      return original(url, options);
    };
  })();`, async () => {
    await waitText(".grade-groups", "5.º");
    await click(".grade-choice", "5.º");
    await waitText(".subject-grid", "Matemáticas");
    await click(".subject-choice", "Matemáticas");
    await waitText(".topic-list", "Problemas con fracciones");
    await click(".topic-choice", "Problemas con fracciones");
    await click(".diagnostic-card .primary-button", "Empezar a estudiar");
    await waitText(".diagnostic-panel", "1 pregunta de prueba");
    await click(".diagnostic-card .text-button", "Salir de la demostración");
    assert.equal(await evaluate("document.querySelector('.diagnostic-panel') === null"), true);
    await click(".diagnostic-card .primary-button", "Empezar a estudiar");
    await waitText(".diagnostic-panel", "No recibirás una nota académica");
    await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
    await waitText(".question-progress", "Pregunta 1 de 1");
    assert.equal(await evaluate("document.querySelector('.diagnostic-panel progress').max"), 1);
    await evaluate("document.querySelector('.answer-option input').click()");
    await click(".diagnostic-panel .primary-button", "Revisar respuesta");
    await waitText(".answer-feedback.pending", "Evaluación pendiente");
    assert.equal(await evaluate("document.querySelector('.answer-feedback.correct, .answer-feedback.incorrect') === null"), true);
    assert.equal(await evaluate("document.querySelector('.answer-option input').checked"), true, "conserva la selección tras fallo");
    await click(".diagnostic-panel .primary-button", "Reintentar evaluación");
    await waitText(".answer-feedback", "Respuesta de referencia");
    await click(".answer-feedback .primary-button", "Ver resumen");
    await waitText(".diagnostic-panel", "Respondiste 1 de 1");
  });
  console.log("OK: aviso al reingresar, banco de una pregunta, progreso 1/1, evaluación pendiente sin acierto supuesto y reintento.");

  await scenario(`(() => { const original = window.fetch.bind(window); window.__allowCatalogRetry = false;
      window.fetch = (url, options) => {
        if (String(url).includes("resource=grades") && !window.__allowCatalogRetry) {
          return Promise.reject(new Error("Fallo simulado"));
        }
        return original(url, options);
      };
    })();`, async () => {
    await waitText('[role="alert"]', "No se pudo cargar el catálogo");
    await evaluate("window.__allowCatalogRetry = true");
    await click(".retry-button", "Reintentar");
    await waitText(".grade-groups", "10.º");
  });
  console.log("OK: error de carga y reintento de grados.");

  await scenario(`(() => { const original = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes("resource=grades")
      ? Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      : original(url, options);
  })();`, async () => {
    await waitText("#grade-title", "¿En qué grado");
    await waitText(".step-card .empty-state", "Aún no hay grados disponibles");
    assert.equal(await evaluate("document.querySelectorAll('.grade-choice').length"), 0);
  });
  console.log("OK: catálogo de grados vacío.");

  await scenario(`(() => { const original = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes("resource=subjects")
      ? Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      : original(url, options);
  })();`, async () => {
    await waitText(".grade-groups", "5.º");
    await click(".grade-choice", "5.º");
    await waitText('.step-card[aria-labelledby="subject-title"] .empty-state', "No hay materias disponibles");
    assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 0);
  });
  console.log("OK: grado sin materias.");

  await scenario(`(() => { const original = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes("resource=topics")
      ? Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      : original(url, options);
  })();`, async () => {
    await waitText(".grade-groups", "10.º");
    await click(".grade-choice", "10.º");
    await waitText(".subject-grid", "Química");
    await click(".subject-choice", "Química");
    await waitText('.step-card[aria-labelledby="topic-title"] .empty-state', "No hay temas disponibles");
    assert.equal(await evaluate("document.querySelectorAll('.topic-choice').length"), 0);
    assert.equal(await evaluate("document.querySelector('.selection-summary') === null"), true);
  });
  console.log("OK: combinación sin temas y sin avance al diagnóstico.");

  await scenario(`(() => { const original = window.fetch.bind(window); let once = false;
    window.fetch = (url, options) => {
      if (String(url).includes("resource=subjects") && !once) {
        once = true; return Promise.reject(new Error("Fallo simulado"));
      }
      return original(url, options);
    };
  })();`, async () => {
    await waitText(".grade-groups", "10.º");
    await click(".grade-choice", "10.º");
    await waitText('[role="alert"]', "No pudimos cargar las materias");
    await click(".retry-button", "Reintentar");
    await waitText(".subject-grid", "Química");
  });
  console.log("OK: error y reintento de materias.");

  await scenario(`(() => { const original = window.fetch.bind(window); let once = false;
    window.fetch = (url, options) => {
      if (String(url).includes("resource=topics") && !once) {
        once = true; return Promise.reject(new Error("Fallo simulado"));
      }
      return original(url, options);
    };
  })();`, async () => {
    await waitText(".grade-groups", "10.º");
    await click(".grade-choice", "10.º");
    await waitText(".subject-grid", "Química");
    await click(".subject-choice", "Química");
    await waitText('[role="alert"]', "No se pudo cargar el catálogo");
    await click(".retry-button", "Reintentar");
    await waitText(".topic-list", "Reacciones inorgánicas");
  });
  console.log("OK: error y reintento de temas.");

  await scenario(`(() => { const original = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes("/api/diagnostic?mode=demo")
      ? new Promise((resolve, reject) => setTimeout(() => original(url, options).then(resolve, reject), 450))
      : original(url, options);
  })();`, async () => {
    await waitText(".grade-groups", "10.º");
    await click(".grade-choice", "10.º");
    await waitText(".subject-grid", "Química");
    await click(".subject-choice", "Química");
    await waitText(".topic-list", "Reacciones inorgánicas");
    await click(".topic-choice", "Reacciones inorgánicas");
    await click(".diagnostic-card .primary-button", "Empezar a estudiar");
    await waitText(".diagnostic-card", "Preparando preguntas");
    await click(".grade-choice", "5.º");
    await new Promise((done) => setTimeout(done, 700));
    assert.equal(await evaluate("document.querySelector('.diagnostic-panel') === null"), true);
    assert.equal(await evaluate("document.querySelector('.diagnostic-card')?.textContent.includes('Antes de comenzar') ?? false"), false);
  });
  console.log("OK: respuesta tardía del diagnóstico descartada al cambiar el grado.");

  await scenario(`(() => { const original = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes("resource=topics") && String(url).includes("grade=G10")
      ? new Promise((resolve, reject) => setTimeout(() => original(url, options).then(resolve, reject), 450))
      : original(url, options);
  })();`, async () => {
    await waitText(".grade-groups", "10.º");
    await click(".grade-choice", "10.º");
    await waitText(".subject-grid", "Química");
    await click(".subject-choice", "Química");
    await click(".grade-choice", "5.º");
    await waitText(".subject-grid", "Español");
    await new Promise((done) => setTimeout(done, 700));
    assert.equal(await evaluate("document.querySelector('.topic-list')?.textContent?.includes('Reacciones inorgánicas') ?? false"), false);
    assert.equal(await evaluate("document.querySelector('.selection-summary')?.textContent.includes('Reacciones inorgánicas') ?? false"), false);
  });
  console.log("OK: respuesta tardía de temas descartada tras cambiar el grado.");
  async function completeStudyForGrade(grade) {
    await navigate();
    await waitFor(() => evaluate("document.querySelector('.welcome-intro button, .main-nav button') !== null"), "pantalla inicial");
    if (await evaluate("document.querySelector('.welcome-intro button') !== null")) {
      await click(".welcome-intro button", "Explorar una vista previa");
    }
    await waitText(".grade-groups", grade);
    await click(".grade-choice", grade);
    await waitText(".subject-grid", "Matemáticas");
    await click(".subject-choice", "Matemáticas");
    await waitFor(() => evaluate("document.querySelector('.topic-choice') !== null"), "tema de " + grade);
    await evaluate("document.querySelector('.topic-choice').click()");
    await click(".diagnostic-card .primary-button", "Empezar a estudiar");
    await waitText(".diagnostic-panel", "Antes de comenzar");
    await click(".diagnostic-panel .primary-button", "Comenzar preguntas");
    for (let index = 0; index < 2; index++) {
      await waitText(".question-progress", `Pregunta ${index + 1} de 2`);
      await evaluate("document.querySelector('.diagnostic-panel .answer-option input').click()");
      await click(".diagnostic-panel .primary-button", "Revisar respuesta");
      await waitText(".answer-feedback", "Respuesta de referencia");
      await click(".answer-feedback .primary-button", index === 0 ? "Siguiente pregunta" : "Ver resumen");
    }
    await waitText(".diagnostic-panel", "Terminaste la demostración");
    await click(".diagnostic-panel .primary-button", "Continuar a estudiar");
    await waitText(".study-screen", "Explicación");
    await finishLesson();
    await waitText(".quick-practice", "Elige una respuesta");
    await evaluate("document.querySelector('.quick-practice .answer-option input').click()");
    await click(".quick-practice .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.quick-practice .answer-feedback') !== null"), "retroalimentación de práctica");
  }
  await completeStudyForGrade("1.º");
  await completeStudyForGrade("6.º");
  console.log("OK: diagnóstico, explicación y práctica en primaria y secundaria; media verificada arriba.");
  if (testAccounts) {
    const restoredLogin = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(testEmail)}, password: ${JSON.stringify(testPassword)} }) }).then((response) => response.status)`);
    assert.equal(restoredLogin, 200);
    await navigate();
    await waitText(".account-panel", testEmail);
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Diagnósticos");
    await waitText(".progress-detail-screen", "10.º · Química");
    await click(".screen-back", "Volver a mi progreso");
    await click(".screen-card-grid button", "Prácticas");
    await waitText(".progress-detail-screen", "Razones y funciones trigonométricas");
    await click(".main-nav button", "Estudiar");
    await click(".route-steps button", "1. Materia");
    await waitText(".subject-grid", "Matemáticas");
    await click(".subject-choice", "Matemáticas");
    await waitFor(() => evaluate("document.querySelector('.topic-choice') !== null"), "tema guardable");
    await evaluate("document.querySelector('.topic-choice').click()");
    await waitFor(() => evaluate("fetch('/api/selection').then((response) => response.json()).then((body) => body.selection?.topicId === 'G10-MAT')"), "último tema persistido");
    await navigate();
    await waitText(".selection-summary", "Razones y funciones trigonométricas");
    const logoutStatus = await evaluate("fetch('/api/auth/logout', { method: 'POST' }).then((response) => response.status)");
    assert.equal(logoutStatus, 200);
    await navigate();
    assert.equal(await evaluate(`document.querySelector('.account-panel')?.textContent?.includes(${JSON.stringify(testEmail)})`), false);
    const secondEmail = `other-${Date.now()}@example.test`;
    const secondStore = openAuthStore();
    await secondStore.register({ email: secondEmail, password: testPassword, adultConfirmed: true });
    secondStore.close();
    const secondStatus = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(secondEmail)}, password: ${JSON.stringify(testPassword)} }) }).then((response) => response.status)`);
    assert.equal(secondStatus, 200);
    const privateSession = await evaluate("fetch('/api/practice/session?sessionId=' + localStorage.getItem('apoyo-practice:G10-MAT')).then((response) => response.status)");
    assert.equal(privateSession, 404, "otra cuenta no puede leer el intento");
    await navigate();
    await waitText(".account-panel", secondEmail);
    await click(".account-deletion button", "Solicitar eliminación");
    await click(".account-deletion button", "Cancelar");
    await click(".account-deletion button", "Solicitar eliminación");
    await evaluate(`(() => { const inputs = document.querySelectorAll('.account-deletion input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inputs[0], 'ELIMINAR'); inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(inputs[1], ${JSON.stringify(testPassword)}); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await click(".account-deletion button", "Eliminar cuenta y datos");
    await waitText(".welcome-notice", "eliminados");
    assert.equal(await evaluate("fetch('/api/auth/me').then((response) => response.json()).then((body) => body.user)"), null);
    const loginStatus = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(testEmail)}, password: ${JSON.stringify(testPassword)} }) }).then((response) => response.status)`);
    assert.equal(loginStatus, 200);
    await navigate();
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Prácticas");
    await waitText(".progress-detail-screen", "Razones y funciones trigonométricas");
    const secondAttempt = await evaluate(`(async () => {
      const started = await fetch('/api/practice/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId: 'G10', subjectId: 'MAT', topicId: 'G10-MAT' }) }).then((response) => response.json());
      for (const question of started.questions) {
        const response = await fetch('/api/practice/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: started.session.id, questionId: question.id, optionId: question.options[0].id }) });
        if (!response.ok) return false;
      }
      return true;
    })()`);
    assert.equal(secondAttempt, true);
    await navigate();
    await waitText(".account-panel", testEmail);
    await click(".main-nav button", "Mi progreso");
    await click(".screen-card-grid button", "Prácticas");
    await waitText(".comparison-result", "Anterior:");
    await waitText(".comparison-result", "Reciente:");
    assert.equal(await evaluate("document.querySelector('.comparison-label select').value"), "G10-MAT");
    console.log("OK: cuenta adulta, progreso persistente, cierre e inicio de sesión en navegador.");
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate();
  await waitFor(() => evaluate("document.querySelector('.main-nav') !== null"), "navegación móvil");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), true, "la página móvil no debe desbordarse horizontalmente");
  assert.equal(await evaluate("[...document.querySelectorAll('.main-nav button')].every((item) => item.getBoundingClientRect().right <= window.innerWidth + 1)"), true, "las tres secciones deben quedar visibles en móvil");
  console.log("OK: navegación visible y sin desbordamiento horizontal a 390 px.");
} finally {
  socket?.close();
  chrome.kill();
  const root = resolve(tmpdir()) + sep;
  const target = realpathSync(profile);
  if (target.startsWith(root)) {
    try { rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
    catch (error) { console.warn("No se pudo limpiar el perfil temporal:", error.message); }
  }
}
