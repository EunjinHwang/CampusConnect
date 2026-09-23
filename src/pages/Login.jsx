import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "./AuthForm";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError("Invalid email or password");
    else navigate(location.state?.from?.pathname ?? "/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Log In</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Logging in..." : "Log In"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Don't have an account?{" "}
        <Link to="/signup" className="text-indigo-600 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
