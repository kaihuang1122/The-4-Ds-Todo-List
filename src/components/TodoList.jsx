import { formatDateTime, formatDeadline, trimPreview } from "../utils";

const sortableColumns = ["title", "dueAt", "importance", "notes", "updatedAt"];

export default function TodoList({
  locale,
  onDelete,
  onEdit,
  onSort,
  sortConfig,
  t,
  todos,
}) {
  if (!todos.length) {
    return (
      <section className="panel table-panel empty-state">
        <p>{t("listEmpty")}</p>
      </section>
    );
  }

  const columns = [
    { key: "title", label: t("columnTask") },
    { key: "dueAt", label: t("columnDeadline") },
    { key: "importance", label: t("columnImportance") },
    { key: "notes", label: t("columnNotes") },
    { key: "updatedAt", label: t("columnUpdated") },
  ];

  function getSortMarker(key) {
    if (!sortableColumns.includes(key)) {
      return "";
    }

    if (sortConfig.key !== key) {
      return "↕";
    }

    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  return (
    <section className="panel table-panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {sortableColumns.includes(column.key) ? (
                    <button className="table-sort" onClick={() => onSort(column.key)} type="button">
                      <span>{column.label}</span>
                      <span>{getSortMarker(column.key)}</span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {todos.map((todo) => (
              <tr key={todo.id}>
                <td>
                  <strong>{todo.title}</strong>
                </td>
                <td>{formatDeadline(todo, locale)}</td>
                <td>{todo.importance.toFixed(1)}</td>
                <td>{trimPreview(todo.notes)}</td>
                <td>{formatDateTime(todo.updatedAt, locale)}</td>
                <td className="row-actions">
                  <button className="button tiny-button ghost-button" onClick={() => onEdit(todo)} type="button">
                    {t("edit")}
                  </button>
                  <button className="button tiny-button danger-button" onClick={() => onDelete(todo)} type="button">
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
