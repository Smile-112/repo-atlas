export const messages = {
  en: { current: "Current map", proposed: "Proposed map", compare: "Compare", theme: "Theme", language: "Language", reset: "Reset demo" },
  ru: { current: "Текущая карта", proposed: "Будущая карта", compare: "Сравнение", theme: "Тема", language: "Язык", reset: "Сбросить демо" }
};

const russian = new Map(Object.entries({
  "Repository intelligence, locally owned": "Аналитика репозиториев, данные остаются у вас",
  "Explore today’s repositories, model a safer tomorrow, then export a reviewable migration plan.": "Изучайте текущие репозитории, моделируйте безопасное будущее и экспортируйте проверяемый план миграции.",
  "Repositories": "Репозитории", "Active": "Активные", "Planned moves": "Запланировано переносов", "Target monorepos": "Целевые монорепозитории",
  "In this workspace": "В рабочей области", "Updated or maintained": "Обновлялись или поддерживаются", "Reversible scenario decisions": "Обратимые решения сценария", "Visible in proposed map": "Видны в будущей карте",
  "Workspace": "Рабочая область", "Current portfolio": "Текущий портфель", "Import GitHub": "Импорт GitHub", "Import GitLab": "Импорт GitLab", "Import local Git": "Импорт локального Git",
  "One selected owner is displayed at a time.": "Одновременно отображается один выбранный владелец.", "Uses the server-side read-only API token.": "Используется read-only API-токен на сервере.", "Reads only explicitly configured, read-only container mounts.": "Читает только явно настроенные read-only монтирования контейнера.",
  "Import repositories": "Импортировать репозитории", "Import GitLab repositories": "Импортировать репозитории GitLab", "Import local repositories": "Импортировать локальные репозитории", "Repository owner": "Владелец репозиториев", "Search": "Поиск", "Domain": "Область", "Decision": "Решение", "Recommendation rules": "Правила рекомендаций", "Merge threshold": "Порог объединения", "Hard stops:": "Жёсткие ограничения:", "Safe by design": "Безопасность по умолчанию", "Decisions are stored as a scenario. They do not modify GitHub.": "Решения хранятся как сценарий и не меняют GitHub.",
  "Repository catalog": "Каталог репозиториев", "repositories in view": "репозиториев показано", "Demo workspace": "Демо-рабочая область", "Repository profile": "Профиль репозитория", "Detected technologies": "Определённые технологии", "Recommendation:": "Рекомендация:", "confidence": "уверенность", "Suggested target:": "Предлагаемая цель:", "Adopt recommendation": "Принять рекомендацию", "Health score": "Оценка состояния", "Last updated": "Последнее обновление", "Target monorepo": "Целевой монорепозиторий", "History strategy": "Стратегия истории", "Preserve full history": "Сохранить полную историю", "Squash into import commit": "Сжать в импорт-коммит", "Tags": "Метки", "Add custom tag": "Добавить свою метку", "Add": "Добавить",
  "Keep separate": "Оставить отдельно", "Move to monorepo": "Перенести в монорепозиторий", "Archive": "Архивировать", "Full history": "Полная история", "Squash": "Сжать",
  "External review, optional": "Внешняя проверка, необязательно", "Export the migration plan": "Экспорт плана миграции", "Download a JSON manifest and Markdown plan for human review. The files never contain tokens or repository contents, and they never execute Git operations.": "Скачайте JSON-манифест и Markdown-план для проверки человеком. Файлы не содержат токенов или содержимого репозиториев и не выполняют Git-операции.", "Download manifest": "Скачать манифест", "Download Markdown": "Скачать Markdown", "Generate AI prompt": "Создать AI-промпт", "Copy prompt": "Скопировать промпт",
  "Migration safety": "Безопасность миграции", "History is a decision, not an afterthought": "История — это решение, а не деталь", "Scenario first": "Сначала сценарий", "Recorded strategy": "Зафиксированная стратегия", "Exact state": "Точное состояние", "Human execution": "Выполнение человеком",
  "Current → proposed": "Текущее → будущее", "Scenario diff": "Различия сценария", "Proposed repository map": "Будущая карта репозиториев", "Edit decisions": "Изменить решения", "Resolve decisions": "Разрешить решения", "No planned imports": "Нет запланированных импортов", "Independent": "Отдельные", "Preserve, don’t delete": "Сохранить, не удалять"
  , "All": "Все", "Archived": "Архивный", "Maintenance": "Поддержка", "Complete": "Завершён", "Moves": "Переносы", "Archives": "Архивы", "Unchanged": "Без изменений", "Conflicts": "Конфликты", "Planned moves": "Запланированные переносы", "Blocking conflicts": "Блокирующие конфликты", "Decisions worth reviewing": "Решения для проверки", "No moves accepted yet.": "Пока нет принятых переносов.", "No archive decisions.": "Нет решений об архивировании.", "No planned imports": "Нет запланированных импортов", "Active": "Активный", "Reset demo": "Сбросить демо"
}));

const originals = new WeakMap();
function localizeRenderedText(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest("textarea, pre, code")) continue;
    const original = originals.get(node) ?? node.nodeValue;
    originals.set(node, original);
    const next = language === "ru" ? (russian.get(original.trim()) ? original.replace(original.trim(), russian.get(original.trim())) : original) : original;
    if (node.nodeValue !== next) node.nodeValue = next;
  }
}

export function observeLocalization(language) {
  localizeRenderedText(language);
  const observer = new MutationObserver(() => localizeRenderedText(language));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
