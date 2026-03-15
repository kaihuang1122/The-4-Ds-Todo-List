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

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(timestamp, weekStartsOn = 1) {
  const date = startOfDay(timestamp);
  const day = date.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

function startOfMonth(timestamp) {
  const date = startOfDay(timestamp);
  date.setDate(1);
  return date;
}

function startOfYear(timestamp) {
  const date = startOfDay(timestamp);
  date.setMonth(0, 1);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years, 0, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatAxisTick(timestamp, locale, unit) {
  const options =
    unit === "month"
      ? { year: "numeric", month: "2-digit" }
      : unit === "year"
        ? { year: "numeric" }
        : { month: "2-digit", day: "2-digit" };

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

  const rangeDays = (endAt - startAt) / DAY_MS;
  const unit =
    rangeDays <= 21
      ? "day"
      : rangeDays <= 90
        ? "week"
        : rangeDays <= 180
          ? "biweek"
          : rangeDays <= 730
            ? "month"
            : "year";

  const ticks = [];
  let current;

  if (unit === "day") {
    current = startOfDay(startAt);
    if (current.getTime() < startAt) {
      current = addDays(current, 1);
    }

    while (current.getTime() <= endAt) {
      ticks.push(current.getTime());
      current = addDays(current, 1);
    }
  } else if (unit === "week" || unit === "biweek") {
    const stepWeeks = unit === "biweek" ? 2 : 1;
    current = startOfWeek(startAt);
    if (current.getTime() < startAt) {
      current = addDays(current, 7 * stepWeeks);
    }

    while (current.getTime() <= endAt) {
      ticks.push(current.getTime());
      current = addDays(current, 7 * stepWeeks);
    }
  } else if (unit === "month") {
    current = startOfMonth(startAt);
    if (current.getTime() < startAt) {
      current = addMonths(current, 1);
    }

    while (current.getTime() <= endAt) {
      ticks.push(current.getTime());
      current = addMonths(current, 1);
    }
  } else {
    current = startOfYear(startAt);
    if (current.getTime() < startAt) {
      current = addYears(current, 1);
    }

    while (current.getTime() <= endAt) {
      ticks.push(current.getTime());
      current = addYears(current, 1);
    }
  }

  if (!ticks.length) {
    const labelUnit = unit === "biweek" ? "week" : unit;
    return [
      { value: startAt, label: formatAxisTick(startAt, locale, labelUnit) },
      { value: endAt, label: formatAxisTick(endAt, locale, labelUnit) },
    ];
  }

  const labelUnit = unit === "biweek" ? "week" : unit;
  return ticks.map((value) => ({
    value,
    label: formatAxisTick(value, locale, labelUnit),
  }));
}
