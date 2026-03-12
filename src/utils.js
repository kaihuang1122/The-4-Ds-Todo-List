export const storageKeys = {
  locale: "quadrant.locale",
  theme: "quadrant.theme",
  viewMode: "quadrant.viewMode",
  sortConfig: "quadrant.sortConfig",
  workspaceTitlePrefix: "quadrant.workspaceTitle",
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

export function getWorkspaceTitleStorageKey(userId) {
  return `${storageKeys.workspaceTitlePrefix}.${userId}`;
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
  return getAxisSummaryWithNow(todos);
}

export function getQuadrantCounts(todos, nowAt = Date.now()) {
  const summary = getAxisSummaryWithNow(todos, nowAt);

  if (!summary) {
    return {
      doNow: 0,
      plan: 0,
      delegate: 0,
      eliminate: 0,
    };
  }

  const dueMidpoint = (summary.domainStartAt + summary.maxDueAt) / 2;
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

export function getAxisSummaryWithNow(todos, nowAt = Date.now()) {
  if (!todos.length) {
    return null;
  }

  const dueValues = todos.map((todo) => todo.dueAt);
  const importanceValues = todos.map((todo) => todo.importance);
  const minDueAt = Math.min(...dueValues);
  const maxDueAt = Math.max(...dueValues);

  return {
    nowAt,
    domainStartAt: Math.min(nowAt, minDueAt),
    minDueAt,
    maxDueAt,
    minImportance: Math.min(...importanceValues),
    maxImportance: Math.max(...importanceValues),
  };
}

const timeTickSteps = [
  60 * 60 * 1000,
  3 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  2 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
  90 * 24 * 60 * 60 * 1000,
  180 * 24 * 60 * 60 * 1000,
  365 * 24 * 60 * 60 * 1000,
  730 * 24 * 60 * 60 * 1000,
];

function formatAxisTick(timestamp, locale, range) {
  const options =
    range <= 2 * 24 * 60 * 60 * 1000
      ? {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      : range <= 120 * 24 * 60 * 60 * 1000
        ? {
            month: "2-digit",
            day: "2-digit",
          }
        : range <= 730 * 24 * 60 * 60 * 1000
          ? {
              year: "numeric",
              month: "2-digit",
            }
          : {
              year: "numeric",
            };

  return new Intl.DateTimeFormat(locale, options).format(new Date(timestamp));
}

export function getTimeAxisTicks(startAt, endAt, locale) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    return [];
  }

  if (endAt <= startAt) {
    return [
      {
        value: startAt,
        label: formatAxisTick(startAt, locale, 0),
      },
    ];
  }

  const range = endAt - startAt;
  const idealStep = range / 5;
  const step = timeTickSteps.find((candidate) => candidate >= idealStep) || timeTickSteps.at(-1);
  const ticks = [startAt];
  let current = Math.ceil(startAt / step) * step;

  while (current < endAt) {
    if (current > startAt) {
      ticks.push(current);
    }

    current += step;
  }

  ticks.push(endAt);

  return [...new Set(ticks.map((value) => Math.round(value)))]
    .sort((left, right) => left - right)
    .map((value) => ({
      value,
      label: formatAxisTick(value, locale, range),
    }));
}
