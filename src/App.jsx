import { useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import AuthPanel from "./components/AuthPanel";
import QuadrantChart from "./components/QuadrantChart";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import TopBar from "./components/TopBar";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { createTranslator, supportedLocales } from "./translations";
import {
  combineDeadline,
  getAuthErrorMessage,
  getQuadrantCounts,
  getSystemTheme,
  readStorage,
  sortTodos,
  storageKeys,
  writeStorage,
} from "./utils";

const defaultSort = {
  key: "dueAt",
  direction: "asc",
};

function parseSortConfig(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object") {
      return defaultSort;
    }

    if (!["title", "dueAt", "importance", "notes", "updatedAt"].includes(parsed.key)) {
      return defaultSort;
    }

    if (!["asc", "desc"].includes(parsed.direction)) {
      return defaultSort;
    }

    return parsed;
  } catch {
    return defaultSort;
  }
}

function normalizeTodo(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: data.title || "",
    dueDate: data.dueDate || "",
    dueTime: data.dueTime || "",
    dueAt: typeof data.dueAt === "number" ? data.dueAt : combineDeadline(data.dueDate, data.dueTime),
    importance: Number(data.importance || 0),
    notes: data.notes || "",
    createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
  };
}

function isEditableTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function SetupView({ locale, onLocaleChange, onThemeChange, t, theme }) {
  return (
    <div className="app-shell">
      <header className="panel setup-toolbar">
        <div>
          <span className="eyebrow">{t("appTitle")}</span>
          <h1>{t("setupTitle")}</h1>
          <p>{t("setupDescription")}</p>
        </div>

        <div className="setup-controls">
          <select
            className="select-input"
            onChange={(event) => onLocaleChange(event.target.value)}
            value={locale}
          >
            {supportedLocales.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>

          <div className="segmented">
            <button
              className={`segment ${theme === "light" ? "active" : ""}`}
              onClick={() => onThemeChange("light")}
              type="button"
            >
              {t("lightTheme")}
            </button>
            <button
              className={`segment ${theme === "dark" ? "active" : ""}`}
              onClick={() => onThemeChange("dark")}
              type="button"
            >
              {t("darkTheme")}
            </button>
          </div>
        </div>
      </header>

      <section className="panel setup-panel">
        <ol className="setup-list">
          <li>{t("setupStep1")}</li>
          <li>{t("setupStep2")}</li>
          <li>{t("setupStep3")}</li>
          <li>{t("setupStep4")}</li>
        </ol>
        <div className="status-banner info">{t("setupHint")}</div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="panel stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function App() {
  const [locale, setLocale] = useState(() => readStorage(storageKeys.locale, "zh-TW"));
  const [theme, setTheme] = useState(() => readStorage(storageKeys.theme, getSystemTheme()));
  const [viewMode, setViewMode] = useState(() => readStorage(storageKeys.viewMode, "quadrant"));
  const [sortConfig, setSortConfig] = useState(() =>
    parseSortConfig(readStorage(storageKeys.sortConfig, JSON.stringify(defaultSort))),
  );
  const [authMode, setAuthMode] = useState("signIn");
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [status, setStatus] = useState(null);
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [workspaceTitleFromCloud, setWorkspaceTitleFromCloud] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const workspaceTitleEditingRef = useRef(false);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const workspaceProfileRef = useMemo(
    () => (db && user ? doc(db, "users", user.uid, "settings", "profile") : null),
    [db, user],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    writeStorage(storageKeys.theme, theme);
  }, [theme, locale]);

  useEffect(() => {
    writeStorage(storageKeys.locale, locale);
  }, [locale]);

  useEffect(() => {
    writeStorage(storageKeys.viewMode, viewMode);
  }, [viewMode]);

  useEffect(() => {
    writeStorage(storageKeys.sortConfig, JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    if (!status) {
      return undefined;
    }

    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTimestamp(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!workspaceProfileRef) {
      setWorkspaceTitle(t("appTitle"));
      setWorkspaceTitleFromCloud("");
      return undefined;
    }

    const unsubscribe = onSnapshot(
      workspaceProfileRef,
      (snapshot) => {
        const data = snapshot.data() || {};
        const remoteTitle = typeof data.workspaceTitle === "string" ? data.workspaceTitle : "";
        setWorkspaceTitleFromCloud(remoteTitle);

        if (!workspaceTitleEditingRef.current) {
          setWorkspaceTitle(remoteTitle || t("appTitle"));
        }
      },
      (error) => {
        setStatus({
          type: "error",
          message: getAuthErrorMessage(error.code, t),
        });
      },
    );

    return unsubscribe;
  }, [t, workspaceProfileRef]);

  useEffect(() => {
    const nextTitle = user ? workspaceTitle.trim() || t("appTitle") : t("appTitle");
    document.title = nextTitle;
  }, [t, user, workspaceTitle]);

  async function persistWorkspaceTitle(rawTitle) {
    if (!workspaceProfileRef) {
      return;
    }

    const trimmed = rawTitle.trim();

    if (trimmed === workspaceTitleFromCloud) {
      return;
    }

    try {
      await setDoc(
        workspaceProfileRef,
        {
          workspaceTitle: trimmed,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setWorkspaceTitleFromCloud(trimmed);
    } catch (error) {
      setStatus({
        type: "error",
        message: getAuthErrorMessage(error.code, t),
      });
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthReady(true);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setBusy(false);

      if (!nextUser) {
        setTodos([]);
        setSelectedTodo(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!db || !user) {
      return undefined;
    }

    const todosQuery = query(collection(db, "users", user.uid, "todos"), orderBy("dueAt", "asc"));
    const unsubscribe = onSnapshot(
      todosQuery,
      (snapshot) => {
        setTodos(snapshot.docs.map(normalizeTodo));
      },
      (error) => {
        setStatus({
          type: "error",
          message: getAuthErrorMessage(error.code, t),
        });
      },
    );

    return unsubscribe;
  }, [user, t]);

  useEffect(() => {
    if (!selectedTodo) {
      return;
    }

    const stillExists = todos.some((todo) => todo.id === selectedTodo.id);

    if (!stillExists) {
      setSelectedTodo(null);
    }
  }, [selectedTodo, todos]);

  const sortedTodos = useMemo(() => sortTodos(todos, sortConfig), [sortConfig, todos]);
  const counts = useMemo(() => getQuadrantCounts(todos, nowTimestamp), [nowTimestamp, todos]);

  function handleSort(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  }

  async function handleAuthSubmit({ mode, email, password, confirmPassword }) {
    if (!auth) {
      return;
    }

    if (mode === "signUp" && password !== confirmPassword) {
      setStatus({
        type: "error",
        message: t("passwordMismatch"),
      });
      return;
    }

    setBusy(true);

    try {
      if (mode === "signUp") {
        await createUserWithEmailAndPassword(auth, email, password);
        setStatus({
          type: "success",
          message: t("signUpSuccess"),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setStatus({
          type: "success",
          message: t("signInSuccess"),
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: getAuthErrorMessage(error.code, t),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    setBusy(true);

    try {
      await signOut(auth);
      setStatus({
        type: "success",
        message: t("signOutSuccess"),
      });
      setSelectedTodo(null);
      setFormVersion((current) => current + 1);
    } catch (error) {
      setStatus({
        type: "error",
        message: getAuthErrorMessage(error.code, t),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTodo(payload) {
    if (!db || !user) {
      return;
    }

    const now = Date.now();
    const dueAt = combineDeadline(payload.dueDate, payload.dueTime);
    const documentData = {
      title: payload.title,
      dueDate: payload.dueDate,
      dueTime: payload.dueTime || "",
      dueAt,
      importance: payload.importance,
      notes: payload.notes || "",
      updatedAt: now,
      createdAt: selectedTodo ? selectedTodo.createdAt : now,
    };

    setBusy(true);

    try {
      if (selectedTodo) {
        await setDoc(doc(db, "users", user.uid, "todos", selectedTodo.id), documentData, { merge: true });
      } else {
        await addDoc(collection(db, "users", user.uid, "todos"), documentData);
      }

      setStatus({
        type: "success",
        message: t("taskSaved"),
      });
      setSelectedTodo(null);
      setFormVersion((current) => current + 1);
    } catch {
      setStatus({
        type: "error",
        message: t("saveFailed"),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(todo) {
    if (!db || !user) {
      return;
    }

    if (!window.confirm(t("confirmDelete"))) {
      return;
    }

    setBusy(true);

    try {
      await deleteDoc(doc(db, "users", user.uid, "todos", todo.id));
      setStatus({
        type: "success",
        message: t("taskDeleted"),
      });
      if (selectedTodo?.id === todo.id) {
        setSelectedTodo(null);
        setFormVersion((current) => current + 1);
      }
    } catch {
      setStatus({
        type: "error",
        message: t("saveFailed"),
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!selectedTodo || busy) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancelEdit();
        return;
      }

      const wantsDelete = event.key === "Delete" || (event.metaKey && event.key === "Backspace");

      if (!wantsDelete || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      void handleDelete(selectedTodo);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, handleCancelEdit, handleDelete, selectedTodo]);

  function handleEdit(todo) {
    setSelectedTodo(todo);
  }

  function handleCancelEdit() {
    setSelectedTodo(null);
    setFormVersion((current) => current + 1);
  }

  function handleWorkspaceTitleBlur() {
    workspaceTitleEditingRef.current = false;
    if (!workspaceTitle.trim()) {
      setWorkspaceTitle(t("appTitle"));
    }
    void persistWorkspaceTitle(workspaceTitle);
  }

  function handleWorkspaceTitleFocus() {
    workspaceTitleEditingRef.current = true;
  }

  if (!isFirebaseConfigured) {
    return (
      <SetupView
        locale={locale}
        onLocaleChange={setLocale}
        onThemeChange={setTheme}
        t={t}
        theme={theme}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="app-shell centered">
        <div className="panel loading-card">
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell auth-page">
        <div className="floating-controls">
          <select
            className="select-input"
            onChange={(event) => setLocale(event.target.value)}
            value={locale}
          >
            {supportedLocales.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>

          <div className="segmented">
            <button
              className={`segment ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
              type="button"
            >
              {t("lightTheme")}
            </button>
            <button
              className={`segment ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
              type="button"
            >
              {t("darkTheme")}
            </button>
          </div>
        </div>

        {status && <div className={`status-banner ${status.type}`}>{status.message}</div>}

        <AuthPanel
          busy={busy}
          mode={authMode}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar
        busy={busy}
        locale={locale}
        onLocaleChange={setLocale}
        onSignOut={handleSignOut}
        onThemeChange={setTheme}
        onViewModeChange={setViewMode}
        onWorkspaceTitleBlur={handleWorkspaceTitleBlur}
        onWorkspaceTitleChange={setWorkspaceTitle}
        onWorkspaceTitleFocus={handleWorkspaceTitleFocus}
        t={t}
        theme={theme}
        user={user}
        viewMode={viewMode}
        workspaceTitle={workspaceTitle}
      />

      {status && <div className={`status-banner ${status.type}`}>{status.message}</div>}

      <section className="stats-grid">
        <StatCard label={t("totalTasks")} value={todos.length} />
        <StatCard label={t("doNow")} value={counts.doNow} />
        <StatCard label={t("plan")} value={counts.plan} />
        <StatCard label={t("delegate")} value={counts.delegate} />
        <StatCard label={t("eliminate")} value={counts.eliminate} />
      </section>

      <section className="content-grid">
        <TodoForm
          busy={busy}
          initialTodo={selectedTodo}
          key={selectedTodo ? `edit-${selectedTodo.id}` : `new-${formVersion}`}
          onCancel={handleCancelEdit}
          onDelete={selectedTodo ? () => handleDelete(selectedTodo) : undefined}
          onSubmit={handleSaveTodo}
          t={t}
        />

        {viewMode === "quadrant" ? (
          <QuadrantChart
            locale={locale}
            nowTimestamp={nowTimestamp}
            onSelect={handleEdit}
            t={t}
            todos={todos}
          />
        ) : (
          <TodoList
            locale={locale}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onSort={handleSort}
            sortConfig={sortConfig}
            t={t}
            todos={sortedTodos}
          />
        )}
      </section>
    </div>
  );
}
