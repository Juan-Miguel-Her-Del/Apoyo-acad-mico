import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

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
    const expression = `[...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.includes(${JSON.stringify(fragment)}))?.click()`;
    await evaluate(expression);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await navigate();
  const testAccounts = process.env.BROWSER_TEST_ACCOUNTS === "true";
  const testEmail = `demo-${Date.now()}@example.test`;
  const testPassword = "DemoPassword-1234";
  if (testAccounts) {
    const status = await evaluate(`fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(testEmail)}, password: ${JSON.stringify(testPassword)}, adultConfirmed: true }) }).then((response) => response.status)`);
    assert.equal(status, 201, "el registro adulto debe funcionar en este servidor de pruebas");
    await navigate();
    await waitText(".account-panel", testEmail);
  }
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
  if (testAccounts) {
    await click(".diagnostic-panel .text-button", "Guardar diagnóstico");
    await waitText(".account-panel", "G10-QUI");
  }
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
  await waitText(".diagnostic-card", "Estudia un tema y ponlo en práctica");
  await waitText(".diagnostic-panel", "Explicación breve");
  await evaluate("document.querySelector('.diagnostic-panel .answer-option input').click()");
  await click(".diagnostic-panel .primary-button", "Revisar respuesta");
  await waitText(".answer-feedback", "¡Correcto!");
  if (testAccounts) {
    await click(".diagnostic-panel .primary-button", "Guardar práctica");
    await waitText(".account-panel", "G10-MAT");
  }
  console.log("OK: dos respuestas del mismo subtema muestran señal demo con preguntas trazables.");
  await click(".grade-choice", "5.º");
  await waitText(".subject-grid", "Español");
  assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 2);
  assert.equal(await evaluate("document.querySelector('.selection-summary').textContent.includes('Reacciones inorgánicas')"), false);
  assert.equal(await evaluate("document.querySelector('.diagnostic-panel') === null"), true, "cambiar grado reinicia el intento");
  await click(".subject-choice", "Español");
  await waitText(".topic-list", "Planear y producir");
  await click(".topic-choice", "Planear y producir");
  await waitText(".selection-summary", "Planear y producir");
  await click(".subject-choice", "Matemáticas");
  await waitText(".topic-list", "Problemas con fracciones");
  assert.equal(await evaluate("document.querySelector('.selection-summary').textContent.includes('Planear y producir')"), false);
  console.log("OK: navegación G10-QUI → G05-ESP → G05-MAT; limpieza de selecciones.");

  async function scenario(source, run) {
    const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", { source });
    try {
      await navigate();
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

  await scenario(`(() => { const original = window.fetch.bind(window); let once = false;
      window.fetch = (url, options) => {
        if (String(url).includes("resource=grades") && !once) {
          once = true;
          return Promise.reject(new Error("Fallo simulado"));
        }
        return original(url, options);
      };
    })();`, async () => {
    await waitText('[role="alert"]', "No se pudo cargar el catálogo");
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
    assert.equal(await evaluate("document.querySelector('.selection-summary').textContent.includes('Tu ruta está preparada')"), false);
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
    assert.equal(await evaluate("document.querySelector('.diagnostic-card').textContent.includes('Antes de comenzar')"), false);
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
    assert.equal(await evaluate("document.querySelector('.selection-summary').textContent.includes('Reacciones inorgánicas')"), false);
  });
  console.log("OK: respuesta tardía de temas descartada tras cambiar el grado.");
  async function completeStudyForGrade(grade) {
    await navigate();
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
    await waitText(".diagnostic-panel", "Explicación breve");
    await evaluate("document.querySelector('.diagnostic-panel .answer-option input').click()");
    await click(".diagnostic-panel .primary-button", "Revisar respuesta");
    await waitFor(() => evaluate("document.querySelector('.diagnostic-panel .answer-feedback') !== null"), "retroalimentación de práctica");
  }
  await completeStudyForGrade("1.º");
  await completeStudyForGrade("6.º");
  console.log("OK: diagnóstico, explicación y práctica en primaria y secundaria; media verificada arriba.");
  if (testAccounts) {
    await navigate();
    await waitText(".account-panel", testEmail);
    await waitText(".account-panel", "G10-QUI");
    await waitText(".account-panel", "G10-MAT");
    const logoutStatus = await evaluate("fetch('/api/auth/logout', { method: 'POST' }).then((response) => response.status)");
    assert.equal(logoutStatus, 200);
    await navigate();
    assert.equal(await evaluate(`document.querySelector('.account-panel')?.textContent?.includes(${JSON.stringify(testEmail)})`), false);
    const loginStatus = await evaluate(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(testEmail)}, password: ${JSON.stringify(testPassword)} }) }).then((response) => response.status)`);
    assert.equal(loginStatus, 200);
    await navigate();
    await waitText(".account-panel", "G10-MAT");
    console.log("OK: cuenta adulta, progreso persistente, cierre e inicio de sesión en navegador.");
  }
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
