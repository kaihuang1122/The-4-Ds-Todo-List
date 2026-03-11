import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  dueDate: "",
  dueTime: "",
  importance: "5.0",
  notes: "",
};

export default function TodoForm({ initialTodo, onCancel, onSubmit, t, busy }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTodo) {
      setForm({
        title: initialTodo.title,
        dueDate: initialTodo.dueDate,
        dueTime: initialTodo.dueTime || "",
        importance: String(initialTodo.importance),
        notes: initialTodo.notes || "",
      });
      setError("");
      return;
    }

    setForm(emptyForm);
    setError("");
  }, [initialTodo]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const importance = Number(form.importance);

    if (!form.title.trim() || !form.dueDate || Number.isNaN(importance)) {
      setError(t("requiredFields"));
      return;
    }

    if (importance < 1 || importance > 10) {
      setError(t("invalidImportance"));
      return;
    }

    setError("");

    await onSubmit({
      title: form.title.trim(),
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      importance,
      notes: form.notes.trim(),
    });
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <span className="eyebrow">{initialTodo ? t("formEditTitle") : t("formCreateTitle")}</span>
        <h2>{initialTodo ? t("formEditTitle") : t("formCreateTitle")}</h2>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("taskName")}</span>
          <input
            className="text-input"
            disabled={busy}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder={t("titlePlaceholder")}
            required
            type="text"
            value={form.title}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>{t("deadlineDate")}</span>
            <input
              className="text-input"
              disabled={busy}
              onChange={(event) => updateField("dueDate", event.target.value)}
              required
              type="date"
              value={form.dueDate}
            />
          </label>

          <label className="field">
            <span>{t("deadlineTime")}</span>
            <input
              className="text-input"
              disabled={busy}
              onChange={(event) => updateField("dueTime", event.target.value)}
              type="time"
              value={form.dueTime}
            />
            <small>{t("deadlineTimeHint")}</small>
          </label>
        </div>

        <label className="field">
          <span>{t("importance")}</span>
          <input
            className="text-input"
            disabled={busy}
            max="10"
            min="1"
            onChange={(event) => updateField("importance", event.target.value)}
            required
            step="0.1"
            type="number"
            value={form.importance}
          />
          <small>{t("importanceHint")}</small>
        </label>

        <label className="field">
          <span>{t("notes")}</span>
          <textarea
            className="text-area"
            disabled={busy}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder={t("notesPlaceholder")}
            rows="6"
            value={form.notes}
          />
        </label>

        {error && <div className="status-banner error">{error}</div>}

        <div className="button-row">
          <button className="button primary-button" disabled={busy} type="submit">
            {initialTodo ? t("updateTask") : t("createTask")}
          </button>

          {initialTodo && (
            <button className="button ghost-button" disabled={busy} onClick={onCancel} type="button">
              {t("cancelEdit")}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
