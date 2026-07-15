import test from "node:test";
import assert from "node:assert/strict";
import { messages, translate } from "../src/i18n.js";

test("Russian navigation has translations for every language control", () => {
  for (const key of Object.keys(messages.en)) assert.equal(typeof messages.ru[key], "string");
});

test("localisation translates static and dynamic text without DOM mutation", () => {
  assert.equal(translate("ru", "Repository catalog"), "Каталог репозиториев");
  assert.equal(translate("ru", "27 repositories in view"), "27 репозиториев показано");
  assert.equal(translate("ru", "27"), "27");
  assert.equal(translate("en", "Repository catalog"), "Repository catalog");
});

test("recommendation explanations and technology stack are translated", () => {
  assert.equal(translate("ru", "Technology stack"), "Стек технологий");
  assert.notEqual(translate("ru", "No target reaches the configured compatibility threshold."), "No target reaches the configured compatibility threshold.");
  assert.equal(translate("ru", "Archive signals: #legacy."), "Архивные признаки: #legacy.");
  assert.equal(translate("ru", "The #client tag prevents automatic merge recommendations."), "Метка #client запрещает автоматические рекомендации по объединению.");
  assert.equal(translate("ru", "Strongest target match: personal-lab scored 12/100; threshold is 60."), "Лучшее совпадение — personal-lab: 12/100 при пороге 60.");
  assert.equal(translate("ru", "Domain checked: Unclassified."), "Проверена область: без классификации.");
  assert.equal(translate("ru", "Lifecycle checked: Active."), "Проверен жизненный цикл: активный.");
});
