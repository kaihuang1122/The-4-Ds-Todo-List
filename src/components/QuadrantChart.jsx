import {
  formatDateTime,
  formatDeadline,
  getAxisSummary,
  getImportancePosition,
  getUrgencyPosition,
} from "../utils";

export default function QuadrantChart({ locale, onSelect, t, todos }) {
  if (!todos.length) {
    return (
      <section className="panel chart-panel empty-state">
        <p>{t("chartEmpty")}</p>
      </section>
    );
  }

  const summary = getAxisSummary(todos);

  return (
    <section className="panel chart-panel">
      <div className="section-heading compact">
        <span className="eyebrow">{t("quadrantView")}</span>
        <h2>{t("urgencyAxis")}</h2>
        <p>{t("importanceAxis")}</p>
      </div>

      <div className="range-list">
        <span>{t("dueRange", { start: formatDateTime(summary.minDueAt, locale), end: formatDateTime(summary.maxDueAt, locale) })}</span>
        <span>
          {t("importanceRange", {
            start: summary.minImportance.toFixed(1),
            end: summary.maxImportance.toFixed(1),
          })}
        </span>
      </div>

      <div className="chart-area">
        <div className="quadrant-line vertical" />
        <div className="quadrant-line horizontal" />

        <div className="quadrant-label top-left">{t("plan")}</div>
        <div className="quadrant-label top-right">{t("doNow")}</div>
        <div className="quadrant-label bottom-left">{t("eliminate")}</div>
        <div className="quadrant-label bottom-right">{t("delegate")}</div>

        {todos.map((todo) => {
          const x = getUrgencyPosition(todo.dueAt, summary.minDueAt, summary.maxDueAt);
          const y = getImportancePosition(
            todo.importance,
            summary.minImportance,
            summary.maxImportance,
          );

          return (
            <button
              className="chart-point"
              key={todo.id}
              onClick={() => onSelect(todo)}
              style={{ left: `${x}%`, bottom: `${y}%` }}
              title={`${todo.title} | ${formatDeadline(todo, locale)} | ${todo.importance.toFixed(1)}`}
              type="button"
            >
              <span>{todo.title.slice(0, 2)}</span>
            </button>
          );
        })}

        <div className="axis-label x-left">{t("lessUrgent")}</div>
        <div className="axis-label x-right">{t("moreUrgent")}</div>
        <div className="axis-label y-top">{t("moreImportant")}</div>
        <div className="axis-label y-bottom">{t("lessImportant")}</div>
      </div>
    </section>
  );
}
