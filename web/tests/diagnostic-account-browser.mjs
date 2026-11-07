import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { openAuthStore } from "../src/lib/auth.ts";
import { getAdaptiveDiagnosticBank } from "../src/lib/diagnostic-adaptive.ts";

const browser = process.env.CHROME_PATH ?? (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "google-chrome");
const baseUrl = process.env.BROWSER_TEST_URL ?? "http://localhost:3100";
const profile = mkdtempSync(join(tmpdir(), "ap-diagnostic-browser-"));
const chrome = spawn(browser, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  "--no-default-browser-check", "--disable-extensions", "--remote-debugging-port=0",
  `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let browserError = "";
chrome.stderr.on("data", (chunk) => { browserError += chunk.toString().slice(0, 1000); });

async function waitFor(check, message, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 80));
  }
  throw new Error(`Tiempo agotado: ${message}`);
}

let socket;
try {
  const portFile = join(profile, "DevToolsActivePort");
  await waitFor(() => existsSync(portFile), `Chrome DevTools: ${browserError}`);
  const port = readFileSync(portFile, "utf8").split("\n")[0];
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  socket = new WebSocket(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (!data.id || !pending.has(data.id)) return;
    const { done, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else done(data.result);
  });
  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((done, reject) => { pending.set(id, { done, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function text(selector, fragment) {
    try {
      await waitFor(() => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.includes(${JSON.stringify(fragment)})`), `${selector}: ${fragment}`);
    } catch (error) {
      console.error("Pantalla:", await evaluate("document.body?.innerText?.slice(0, 1800)"));
      throw error;
    }
  }
  async function click(selector, fragment) {
    await evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.includes(${JSON.stringify(fragment)}))?.click()`);
  }
  async function navigate() {
    await send("Page.navigate", { url: `${baseUrl}/?account-diagnostic-smoke=${Date.now()}` });
    await waitFor(() => evaluate("document.readyState === 'complete'"), "página cargada");
  }
  async function selectTopic() {
    await waitFor(async () => {
      await click(".route-steps button", "1. Materia");
      return evaluate("Boolean(document.querySelector('.subject-grid'))");
    }, "selector de materia interactivo");
    await text(".subject-grid", "Matemáticas");
    await click(".subject-choice", "Matemáticas");
    await text(".topic-list", "Razones y funciones");
    await click(".topic-choice", "Razones y funciones");
    await click(".diagnostic-card .primary-button", "Empezar a estudiar");
  }
  const diagnosticBank = getAdaptiveDiagnosticBank("G10", "MAT", "G10-MAT");
  async function chooseIncorrectAnswer() {
    const questionId = await evaluate("document.querySelector('.diagnostic-account-attempt .answer-option input').name");
    const question = diagnosticBank.find((item) => item.id === questionId);
    assert.ok(question, `pregunta ${questionId} dentro del banco`);
    const wrong = question.options.find((option) => option.id !== question.correctOptionId);
    await evaluate(`document.querySelector('.diagnostic-account-attempt .answer-option input[value=${JSON.stringify(wrong.id)}]').click()`);
  }
  async function chooseCorrectAnswer() {
    const questionId = await evaluate("document.querySelector('.diagnostic-account-attempt .answer-option input').name");
    const question = diagnosticBank.find((item) => item.id === questionId);
    assert.ok(question, `pregunta ${questionId} dentro del banco`);
    await evaluate(`document.querySelector('.diagnostic-account-attempt .answer-option input[value=${JSON.stringify(question.correctOptionId)}]').click()`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await navigate();
  const email = `diagnostic-${Date.now()}@example.test`;
  const store = openAuthStore();
  try {
    const account = await store.register({ email, password: "DemoPassword-1234", adultConfirmed: true });
    store.saveProfile(account.user.id, { displayName: "Prueba diagnóstica", gradeId: "G10" });
  } finally { store.close(); }
  const anonymous = await fetch(`${baseUrl}/api/diagnostic/attempt?gradeId=G10&subjectId=MAT&topicId=G10-MAT`);
  assert.equal(anonymous.status, 401, "sin cookie no se accede a intentos");
  assert.equal((await fetch(`${baseUrl}/api/diagnostic/attempts`)).status, 401,
    "sin cookie no se accede al historial diagnóstico");
  const login = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(email)}, password: 'DemoPassword-1234' }) }).then((response) => response.status)`);
  assert.equal(login, 200, "la cuenta de prueba debe iniciar sesión");
  await navigate();
  await selectTopic();
  await text(".diagnostic-account-attempt", "Pregunta 1 de 4");
  await click(".diagnostic-account-attempt .primary-button", "Revisar respuesta");
  await text(".diagnostic-error", "Selecciona una respuesta");
  const firstQuestionId = await evaluate("document.querySelector('.diagnostic-account-attempt .answer-option input').name");
  const attemptId = await evaluate("localStorage.getItem('apoyo-diagnostic:G10-MAT')");
  assert.match(attemptId, /^[0-9a-f]{32}$/);
  const before = await evaluate(`fetch('/api/diagnostic/attempt?attemptId=${attemptId}').then((response) => response.json())`);
  assert.equal(before.attempt.answered, 0, "entrada vacía no suma respuesta");
  assert.equal("questions" in before, false, "el servidor no entrega preguntas futuras");
  assert.equal("correctOptionId" in before.question, false, "GET no revela la solución");
  const repeatedStart = await evaluate("fetch('/api/diagnostic/attempt/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({gradeId:'G10',subjectId:'MAT',topicId:'G10-MAT',mode:'demo'}) }).then((response) => response.status)");
  assert.equal(repeatedStart, 409, "no se crea otro intento mientras haya uno abierto");
  const crossOrigin = await fetch(`${baseUrl}/api/diagnostic/attempt/answer`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://otro-sitio.invalid" },
    body: JSON.stringify({ attemptId, questionId: firstQuestionId, optionId: "a" }),
  });
  assert.equal(crossOrigin.status, 403, "origen cruzado no puede enviar respuestas");
  const published = await evaluate("fetch('/api/diagnostic/attempt/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({gradeId:'G10',subjectId:'MAT',topicId:'G10-MAT',mode:'published'}) }).then((response) => response.status)");
  assert.equal(published, 409, "el modo publicado sigue bloqueado");
  await evaluate("window.__diagnosticPosts = 0; const original = window.fetch; window.fetch = (...args) => { if (String(args[0]).endsWith('/api/diagnostic/attempt/answer')) window.__diagnosticPosts++; return original(...args); }");
  await chooseIncorrectAnswer();
  await evaluate("const button = document.querySelector('.diagnostic-account-attempt .primary-button'); button.click(); button.click()");
  await text(".diagnostic-account-attempt .answer-feedback", "Explicación pendiente de revisión docente");
  assert.equal(await evaluate("window.__diagnosticPosts"), 1, "doble clic envía una sola respuesta");
  const duplicate = await evaluate(`fetch('/api/diagnostic/attempt/answer', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({attemptId:${JSON.stringify(attemptId)}, questionId:${JSON.stringify(firstQuestionId)}, optionId:'a'})}).then((response) => response.status)`);
  assert.equal(duplicate, 409, "no se registra dos veces una pregunta");
  await navigate();
  await selectTopic();
  await text(".diagnostic-account-attempt", "Pregunta 2 de 4");
  await text(".diagnostic-account-attempt", "Intento recuperado desde el servidor");
  const secondQuestionId = await evaluate("document.querySelector('.diagnostic-account-attempt .answer-option input').name");
  const invalid = await evaluate(`fetch('/api/diagnostic/attempt/answer', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({attemptId:${JSON.stringify(attemptId)}, questionId:${JSON.stringify(secondQuestionId)}, optionId:'z'})}).then((response) => response.status)`);
  assert.equal(invalid, 400, "opción ajena no se cuenta");
  for (let current = 2; current <= 4; current += 1) {
    await text(".question-progress", `Pregunta ${current} de 4`);
    await chooseIncorrectAnswer();
    await click(".diagnostic-account-attempt .primary-button", "Revisar respuesta");
    await text(".diagnostic-account-attempt .answer-feedback", "Explicación pendiente de revisión docente");
    await click(".diagnostic-account-attempt .answer-feedback .primary-button", current === 4 ? "Ver resumen" : "Siguiente pregunta");
  }
  await text(".diagnostic-account-attempt .diagnostic-panel", "Terminaste la demostración");
  await text(".diagnostic-account-attempt .provisional-explanation", "G10-MAT:seno");
  await waitFor(() => evaluate("[...document.querySelectorAll('.diagnostic-account-attempt .provisional-explanation .explanation-followup button')].some((button) => button.textContent.includes('Sí, me ayudó') && !button.disabled)"), "valoración disponible");
  await click(".diagnostic-account-attempt .provisional-explanation .explanation-followup button", "Sí, me ayudó");
  await text(".diagnostic-account-attempt .provisional-explanation .explanation-followup", "Valoración guardada en tu cuenta");
  const final = await evaluate(`fetch('/api/diagnostic/attempt?attemptId=${attemptId}').then((response) => response.json())`);
  assert.equal(final.attempt.status, "completed");
  assert.equal(final.attempt.answered, 4);
  assert.equal(final.answers.length, 4);
  assert.equal(new Set(final.answers.map((answer) => answer.questionId)).size, 4);
  const history = await evaluate("fetch('/api/diagnostic/attempts').then((response) => response.json())");
  assert.equal(history.items.find((item) => item.id === attemptId)?.answered, 4,
    "el historial incluye el intento propio completado");
  assert.equal("question" in history.items.find((item) => item.id === attemptId), false,
    "el historial no adelanta preguntas");
  assert.equal(await evaluate(`document.querySelector('.diagnostic-account-attempt .diagnostic-panel').textContent.includes('acertaste ${final.attempt.correctCount}')`), true);
  await navigate();
  await selectTopic();
  await text(".diagnostic-account-attempt", "Intento recuperado desde el servidor");
  await text(".diagnostic-account-attempt", "Terminaste la demostración");
  await click(".diagnostic-account-attempt button", "Iniciar otro intento");
  await text(".diagnostic-account-attempt", "Pregunta 1 de 4");
  for (let current = 1; current <= 4; current += 1) {
    await chooseCorrectAnswer();
    await click(".diagnostic-account-attempt .primary-button", "Revisar respuesta");
    await text(".diagnostic-account-attempt .answer-feedback", "Respuesta correcta");
    await click(".diagnostic-account-attempt .answer-feedback .primary-button", current === 4 ? "Ver resumen" : "Siguiente pregunta");
  }
  await text(".diagnostic-account-attempt .skill-strengths", "G10-MAT:seno");
  console.log("OK: intento de cuenta adulta, reanudación, respuesta única, entrada inválida, fin y resumen persistido.");
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
