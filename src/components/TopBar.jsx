import { supportedLocales } from "../translations";

export default function TopBar({
  locale,
  onLocaleChange,
  onSignOut,
  onThemeChange,
  onViewModeChange,
  onWorkspaceTitleBlur,
  onWorkspaceTitleChange,
  t,
  theme,
  user,
  viewMode,
  workspaceTitle,
  busy,
}) {
  return (
    <header className="panel hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">{t("statusReady")}</span>
        <input
          aria-label={t("workspaceTitleLabel")}
          className="workspace-title-input"
          maxLength="60"
          onBlur={onWorkspaceTitleBlur}
          onChange={(event) => onWorkspaceTitleChange(event.target.value)}
          placeholder={t("workspaceTitlePlaceholder")}
          type="text"
          value={workspaceTitle}
        />
        <p>{t("appSubtitle")}</p>
        <div className="account-chip">
          <span>{t("currentUser")}</span>
          <strong>{user.email}</strong>
        </div>
      </div>

      <div className="hero-controls">
        <div className="control-group">
          <span className="control-label">{t("language")}</span>
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
        </div>

        <div className="control-group">
          <span className="control-label">{t("theme")}</span>
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

        <div className="control-group">
          <span className="control-label">{t("viewMode")}</span>
          <div className="segmented">
            <button
              className={`segment ${viewMode === "quadrant" ? "active" : ""}`}
              onClick={() => onViewModeChange("quadrant")}
              type="button"
            >
              {t("quadrantView")}
            </button>
            <button
              className={`segment ${viewMode === "list" ? "active" : ""}`}
              onClick={() => onViewModeChange("list")}
              type="button"
            >
              {t("listView")}
            </button>
          </div>
        </div>

        <button className="button ghost-button" disabled={busy} onClick={onSignOut} type="button">
          {t("signOut")}
        </button>
      </div>
    </header>
  );
}
