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
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
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
  async function navigate() {
    await send("Page.navigate", { url: baseUrl });
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
  await waitText(".grade-groups", "10.º");
  assert.equal(await evaluate("document.querySelectorAll('.grade-choice:not(:disabled)').length"), 2);
  await click(".grade-choice", "10.º");
  await waitText(".subject-grid", "Química");
  assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 4);
  await click(".subject-choice", "Química");
  await waitText(".topic-list", "Reacciones inorgánicas");
  await click(".topic-choice", "Reacciones inorgánicas");
  await waitText(".selection-summary", "Reacciones inorgánicas");
  await click(".grade-choice", "5.º");
  await waitText(".subject-grid", "Español");
  assert.equal(await evaluate("document.querySelectorAll('.subject-choice').length"), 2);
  assert.equal(await evaluate("document.querySelector('.selection-summary').textContent.includes('Reacciones inorgánicas')"), false);
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
    await waitText(".step-card:nth-of-type(3) .empty-state", "No hay materias disponibles");
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
    await waitText(".step-card:nth-of-type(4) .empty-state", "No hay temas disponibles");
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
