import test from "node:test";
import assert from "node:assert/strict";
import {
  grades, subjects, topics, getDemoSubjects, getDemoTopics,
  getPublishedTopics, getPublishedSubjects, isPublishedGrade, isDemoGrade,
} from "../src/lib/catalog.ts";
import {
  emptySelection, selectGrade, selectSubject, selectTopic, validSelection,
} from "../src/lib/selection.ts";

test("catálogo colombiano: 11 grados y 26 combinaciones válidas", () => {
  assert.equal(grades.length, 11);
  assert.deepEqual(grades.map((grade) => grade.number), Array.from({ length: 11 }, (_, index) => index + 1));
  assert.equal(grades.filter((grade) => grade.group === "Primaria").length, 5);
  assert.equal(grades.filter((grade) => grade.group === "Bachillerato").length, 6);
  assert.equal(topics.length, 26);
  assert.equal(new Set(topics.map((topic) => topic.id)).size, 26);
  for (const topic of topics) {
    const grade = grades.find((item) => item.id === topic.gradeId);
    const subject = subjects.find((item) => item.id === topic.subjectId);
    assert.ok(grade && subject?.grades.includes(grade.number), topic.id);
  }
  for (const grade of grades) {
    assert.equal(isPublishedGrade(grade.id), false);
    assert.deepEqual(getPublishedSubjects(grade.id), []);
  }
});

test("piloto: solo 5.º y 10.º; Física y Química solo desde 10.º", () => {
  assert.deepEqual(grades.filter((grade) => isDemoGrade(grade.id)).map((grade) => grade.id), ["G05", "G10"]);
  assert.deepEqual(getDemoSubjects("G05").map((subject) => subject.id), ["MAT", "ESP"]);
  assert.deepEqual(getDemoSubjects("G10").map((subject) => subject.id), ["MAT", "ESP", "FIS", "QUI"]);
  assert.equal(getDemoSubjects("G03").length, 0);
  assert.equal(getDemoTopics("G05", "FIS").length, 0);
  assert.equal(getDemoTopics("G11", "QUI").length, 0);
  assert.equal(topics.filter((topic) => topic.pilotCandidate).length, 6);
});

test("ningún contenido de prueba puede considerarse publicado", () => {
  for (const topic of topics) {
    assert.equal(topic.approvedForPublication, false);
    assert.equal(topic.validatedQuestionCount, 0);
    assert.deepEqual(getPublishedTopics(topic.gradeId, topic.subjectId), []);
  }
  assert.ok(topics.filter((topic) => !topic.pilotCandidate).every((topic) => !topic.active));
});

test("cambiar grado o materia borra las selecciones dependientes", () => {
  const original = { gradeId: "G10", subjectId: "FIS", topicId: "G10-FIS" };
  assert.deepEqual(selectGrade(original, "G05"), { gradeId: "G05", subjectId: null, topicId: null });
  assert.deepEqual(selectSubject(original, "QUI"), { gradeId: "G10", subjectId: "QUI", topicId: null });
  assert.deepEqual(selectSubject(emptySelection, "MAT"), emptySelection);
  assert.equal(selectTopic(original, "G10-QUI").topicId, "G10-QUI");
});

test("el tema no se valida si cambia el contexto, está inactivo o falta en la respuesta", () => {
  const selected = { gradeId: "G10", subjectId: "FIS", topicId: "G10-FIS" };
  const gradeList = grades;
  const subjectList = getDemoSubjects("G10");
  const topicList = getDemoTopics("G10", "FIS");
  assert.deepEqual(validSelection(selected, gradeList, subjectList, topicList), selected);
  assert.equal(validSelection(selected, gradeList, subjectList, []).topicId, null);
  assert.equal(validSelection(selected, gradeList, subjectList, [{ ...topicList[0], active: false }]).topicId, null);
  assert.equal(validSelection(selected, gradeList, getDemoSubjects("G05"), topicList).subjectId, null);
  assert.equal(validSelection({ ...selected, topicId: "G10-QUI" }, gradeList, subjectList, topicList).topicId, null);
  assert.deepEqual(validSelection(selected, [], subjectList, topicList), emptySelection);
});
