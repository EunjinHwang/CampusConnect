
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lightOn, setLightOn] = useState(true);

  // Existing Supabase authentication
  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const { error: loginError } = await signIn(
        email.trim(),
        password
      );

      if (loginError) {
        setError("Invalid email or password");
        return;
      }

      navigate(location.state?.from?.pathname ?? "/", {
        replace: true,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`cc-login-scene ${lightOn ? "" : "light-off"}`}>
      {/* Background stars */}
      <div className="cc-login-stars" aria-hidden="true" />

      {/* Light switch */}
      <button
        type="button"
        className="cc-light-switch"
        onClick={() => setLightOn(!lightOn)}
        aria-label={lightOn ? "Turn lamp off" : "Turn lamp on"}
        aria-pressed={lightOn}
      >
        <span className={lightOn ? "active" : ""} />
        <span className={!lightOn ? "active" : ""} />
      </button>

      <div className="cc-login-layout">
        {/* Animated desk lamp */}
        <div className="cc-lamp-area" aria-hidden="true">
          <div className="cc-lamp">
            <div className="cc-lamp-beam" />
            <div className="cc-lamp-shade" />
            <div className="cc-lamp-bulb" />
            <div className="cc-lamp-upper-arm" />
            <div className="cc-lamp-joint cc-lamp-joint-top" />
            <div className="cc-lamp-lower-arm" />
            <div className="cc-lamp-joint cc-lamp-joint-bottom" />
            <div className="cc-lamp-base" />
          </div>
          <p className="cc-lamp-caption">
            Your campus. Your community.
          </p>
        </div>

        {/* Login form */}
        <div className="cc-login-card">
          <div className="cc-login-logo">CampusConnect</div>

          <h1>Welcome Back</h1>
          <p className="cc-login-subtitle">
            Sign in to continue your campus experience.
          </p>

          <div className="cc-auth-tabs">
            <span className="cc-auth-tab-active">Sign In</span>
            <Link to="/signup">Sign Up</Link>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="cc-login-email">
              Email Address
            </label>
            <div className="cc-input-wrapper">
              <span aria-hidden="true">✉</span>
              <input
                id="cc-login-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label htmlFor="cc-login-password">
              Password
            </label>
            <div className="cc-input-wrapper">
              <span aria-hidden="true">🔒</span>
              <input
                id="cc-login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="cc-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p className="cc-login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="cc-login-submit"
              disabled={busy}
            >
              {busy ? "Signing In..." : "Sign In →"}
            </button>
          </form>

          <p className="cc-login-bottom">
            New to CampusConnect?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
