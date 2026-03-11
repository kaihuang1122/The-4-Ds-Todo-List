import { useState } from "react";

export default function AuthPanel({ mode, onModeChange, onSubmit, t, busy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignIn = mode === "signIn";

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      mode,
      email: email.trim(),
      password,
      confirmPassword,
    });
  }

  return (
    <section className="auth-shell">
      <div className="panel auth-card">
        <div className="section-heading">
          <span className="eyebrow">{t("appTitle")}</span>
          <h1>{t("authTitle")}</h1>
          <p>{t("authSubtitle")}</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t("email")}</span>
            <input
              autoComplete="email"
              className="text-input"
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="field">
            <span>{t("password")}</span>
            <input
              autoComplete={isSignIn ? "current-password" : "new-password"}
              className="text-input"
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {!isSignIn && (
            <label className="field">
              <span>{t("confirmPassword")}</span>
              <input
                autoComplete="new-password"
                className="text-input"
                disabled={busy}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          )}

          <button className="button primary-button" disabled={busy} type="submit">
            {isSignIn ? t("signIn") : t("signUp")}
          </button>
        </form>

        <button
          className="button ghost-button inline-button"
          disabled={busy}
          onClick={() => onModeChange(isSignIn ? "signUp" : "signIn")}
          type="button"
        >
          {isSignIn ? t("switchToSignUp") : t("switchToSignIn")}
        </button>
      </div>
    </section>
  );
}
