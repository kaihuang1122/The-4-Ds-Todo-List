export const storageKeys = {
  locale: "quadrant.locale",
  theme: "quadrant.theme",
  viewMode: "quadrant.viewMode",
  sortConfig: "quadrant.sortConfig",
};

export function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStorage(key, fallbackValue) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallbackValue : raw;
  } catch {
    return fallbackValue;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function combineDeadline(dueDate, dueTime) {
  if (!dueDate) {
    return Date.now();
  }

  const timestamp = new Date(`${dueDate}T${dueTime || "23:59"}`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

export function formatDateTime(timestamp, locale) {
  if (!Number.isFinite(timestamp)) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDeadline(todo, locale) {
  if (!todo || !todo.dueDate) {
    return "--";
  }

  const timestamp = combineDeadline(todo.dueDate, todo.dueTime);
  const options = todo.dueTime
    ? {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    : {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };

  return new Intl.DateTimeFormat(locale, options).format(new Date(timestamp));
}

export function trimPreview(value, maxLength = 88) {
  if (!value) {
    return "—";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function sortTodos(todos, sortConfig) {
  const accessors = {
    title: (todo) => todo.title.toLowerCase(),
    dueAt: (todo) => todo.dueAt,
    importance: (todo) => todo.importance,
    notes: (todo) => todo.notes.toLowerCase(),
    updatedAt: (todo) => todo.updatedAt,
  };

  const accessor = accessors[sortConfig.key] || accessors.dueAt;

  return [...todos].sort((left, right) => {
    const leftValue = accessor(left);
    const rightValue = accessor(right);

    if (leftValue < rightValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }

    if (leftValue > rightValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }

    return 0;
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getUrgencyPosition(dueAt, minDueAt, maxDueAt) {
  if (minDueAt === maxDueAt) {
    return 50;
  }

  const normalized = (maxDueAt - dueAt) / (maxDueAt - minDueAt);
  return 12 + clamp(normalized, 0, 1) * 76;
}

export function getImportancePosition(importance, minImportance, maxImportance) {
  if (minImportance === maxImportance) {
    return 50;
  }

  const normalized = (importance - minImportance) / (maxImportance - minImportance);
  return 12 + clamp(normalized, 0, 1) * 76;
}

export function getAxisSummary(todos) {
  if (!todos.length) {
    return null;
  }

  const dueValues = todos.map((todo) => todo.dueAt);
  const importanceValues = todos.map((todo) => todo.importance);

  return {
    minDueAt: Math.min(...dueValues),
    maxDueAt: Math.max(...dueValues),
    minImportance: Math.min(...importanceValues),
    maxImportance: Math.max(...importanceValues),
  };
}

export function getQuadrantCounts(todos) {
  const summary = getAxisSummary(todos);

  if (!summary) {
    return {
      doNow: 0,
      plan: 0,
      delegate: 0,
      eliminate: 0,
    };
  }

  const dueMidpoint = (summary.minDueAt + summary.maxDueAt) / 2;
  const importanceMidpoint = (summary.minImportance + summary.maxImportance) / 2;

  return todos.reduce(
    (counts, todo) => {
      const urgent = todo.dueAt <= dueMidpoint;
      const important = todo.importance >= importanceMidpoint;

      if (urgent && important) {
        counts.doNow += 1;
      } else if (!urgent && important) {
        counts.plan += 1;
      } else if (urgent && !important) {
        counts.delegate += 1;
      } else {
        counts.eliminate += 1;
      }

      return counts;
    },
    {
      doNow: 0,
      plan: 0,
      delegate: 0,
      eliminate: 0,
    },
  );
}

export function getAuthErrorMessage(errorCode, t) {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return t("errorEmailInUse");
    case "auth/invalid-email":
      return t("errorInvalidEmail");
    case "auth/weak-password":
      return t("errorWeakPassword");
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return t("errorInvalidCredential");
    case "permission-denied":
      return t("errorPermission");
    default:
      return t("errorGenericAuth");
  }
}
