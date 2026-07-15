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
  "Accept, edit, or discard recommendations without touching a repository.": "Принимайте, меняйте или отклоняйте рекомендации, не затрагивая репозитории.", "Each move explicitly uses full history or a squashed import.": "Для каждого переноса явно выбрана полная история или squash-импорт.", "Imports include the source branch and commit SHA when GitHub metadata is available.": "Импорт содержит исходную ветку и SHA коммита, когда эти метаданные доступны.", "Atlas exports a review plan; it never runs destructive Git actions.": "Atlas экспортирует план для проверки и не выполняет разрушительные Git-операции.",
  "Current → proposed": "Текущее → будущее", "Scenario diff": "Различия сценария", "Proposed repository map": "Будущая карта репозиториев", "Edit decisions": "Изменить решения", "Resolve decisions": "Разрешить решения", "No planned imports": "Нет запланированных импортов", "Independent": "Отдельные", "Preserve, don’t delete": "Сохранить, не удалять"
  , "Target monorepo": "Целевой монорепозиторий", "This is a preview of accepted decisions. No repository has been moved.": "Это предварительный вид принятых решений. Ни один репозиторий не перемещён.", "Distinct product, deployment, client, or portfolio scope.": "Отдельный продукт, развёртывание, клиентская или портфельная область.", "Original URLs and history remain available.": "Исходные URL и история остаются доступными.", "Every row is a planned change, not a Git operation.": "Каждая строка — планируемое изменение, а не Git-операция.", "Become subprojects": "Станут подпроектами", "Retain history and URL": "Сохранят историю и URL", "Stay standalone": "Останутся отдельными", "Must be resolved": "Нужно разрешить", "Accepted decisions match the active recommendation rules.": "Принятые решения соответствуют активным правилам рекомендаций.",
  "All": "Все", "Archived": "Архивный", "Maintenance": "Поддержка", "Complete": "Завершён", "Moves": "Переносы", "Archives": "Архивы", "Unchanged": "Без изменений", "Conflicts": "Конфликты", "Planned moves": "Запланированные переносы", "Blocking conflicts": "Блокирующие конфликты", "Decisions worth reviewing": "Решения для проверки", "No moves accepted yet.": "Пока нет принятых переносов.", "No archive decisions.": "Нет решений об архивировании.", "No planned imports": "Нет запланированных импортов", "Active": "Активные", "Reset demo": "Сбросить демо", "Saved in this browser": "Сохранено в этом браузере", "Restored from this browser": "Восстановлено из этого браузера", "Demo workspace restored": "Демо-область восстановлена", "Could not save locally": "Не удалось сохранить локально"
}));

const translations = new WeakMap();
const englishByRussian = new Map([...russian].map(([english, translated]) => [translated, english]));

function translateDynamicEnglish(value) {
  const patterns = [
    [/^(\d+) repositories in view$/, "$1 репозиториев показано"],
    [/^Imported (\d+) repositories\.$/, "Импортировано репозиториев: $1."],
    [/^Imported (\d+) GitLab repositories\.$/, "Импортировано репозиториев GitLab: $1."],
    [/^Imported (\d+) local repositories\.$/, "Импортировано локальных репозиториев: $1."],
    [/^(\d+)% confidence$/, "уверенность $1%"],
    [/^Shared tags: (.+)\.$/, "Общие метки: $1."],
    [/^Compatible stack: (.+)\.$/, "Совместимый стек: $1."],
    [/^Matches the (.+) domain\.$/, "Соответствует области $1."],
    [/^Suggested target:$/, "Предлагаемая цель:"]
  ];
  for (const [pattern, replacement] of patterns) if (pattern.test(value)) return value.replace(pattern, replacement);
  return null;
}

function localizeRenderedText(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest("textarea, pre, code")) continue;
    const current = node.nodeValue;
    let translation = translations.get(node);
    if (translation && current !== translation.en && current !== translation.ru) {
      translations.delete(node);
      translation = null;
    }
    if (!translation) {
      const trimmed = current.trim();
      const english = russian.has(trimmed) || translateDynamicEnglish(trimmed) ? trimmed : englishByRussian.get(trimmed);
      if (!english) continue;
      const translated = russian.get(english) ?? translateDynamicEnglish(english);
      if (!translated) continue;
      translation = {
        en: current.replace(trimmed, english),
        ru: current.replace(trimmed, translated)
      };
      translations.set(node, translation);
    }
    const next = translation[language];
    if (node.nodeValue !== next) node.nodeValue = next;
  }
}

export { localizeRenderedText };

export function observeLocalization(language) {
  localizeRenderedText(language);
  const observer = new MutationObserver(() => localizeRenderedText(language));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
