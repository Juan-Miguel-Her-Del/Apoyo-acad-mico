import test from "node:test";
import assert from "node:assert/strict";
import { openAIExplanationProvider } from "../src/lib/explanation-openai.ts";
import { explanationLevelForGrade } from "../src/lib/explanation-adaptation.ts";

const input = {
  gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", topicName: "Fracciones",
  subskillId: "G05-MAT:fracciones", sourceVersion: "teacher-v1",
  explanation: "Dos fracciones son equivalentes cuando representan la misma parte de un todo.",
  example: "Un medio y dos cuartos representan la misma cantidad de una unidad dividida.",
  reference: "Fuente revisada",
  level: explanationLevelForGrade("G05"), exampleIndex: 0,
};
const modelOutput = {
  topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
  explanation: input.explanation, example: input.example,
};

test("adaptador OpenAI usa Responses con clave de servidor, salida estructurada y sin datos de cuenta", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldModel = process.env.APOYO_EXPLANATION_MODEL;
  const oldFetch = globalThis.fetch;
  try {
    process.env.OPENAI_API_KEY = "server-test-key";
    delete process.env.APOYO_EXPLANATION_MODEL;
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "https://api.openai.com/v1/responses");
      assert.equal(options.headers.Authorization, "Bearer server-test-key");
      assert.equal(options.cache, "no-store");
      const request = JSON.parse(options.body);
      assert.equal(request.model, "gpt-6-luna");
      assert.equal(request.store, false);
      assert.equal(request.text.format.type, "json_schema");
      assert.equal(request.text.format.strict, true);
      assert.equal(JSON.parse(request.input).approvedText.explanation, input.explanation);
      assert.equal(JSON.parse(request.input).level.gradeId, "G05");
      assert.equal(JSON.parse(request.input).exampleIndex, 0);
      assert.equal(options.body.includes("userId"), false);
      assert.equal(options.body.includes("email"), false);
      return Response.json({ status: "completed", output: [{ type: "message", role: "assistant",
        content: [{ type: "output_text", text: JSON.stringify(modelOutput) }] }] });
    };
    assert.deepEqual(await openAIExplanationProvider(input), modelOutput);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.APOYO_EXPLANATION_MODEL;
    else process.env.APOYO_EXPLANATION_MODEL = oldModel;
  }
});

test("sin clave o con respuesta incompleta no devuelve explicación", async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(openAIExplanationProvider(input), /key unavailable/);
    process.env.OPENAI_API_KEY = "server-test-key";
    globalThis.fetch = async () => Response.json({ status: "incomplete", output: [] });
    await assert.rejects(openAIExplanationProvider(input), /incomplete/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
