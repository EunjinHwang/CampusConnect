import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "./AuthForm";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error } = await signUp(email, password, name);
    setBusy(false);
    if (error) return setError(error.message);
    // 이메일 확인을 켜둔 경우 세션이 없음
    if (!data.session)
      return setError("가입 완료! 이메일로 온 확인 링크를 눌러주세요.");
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign up</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="password (6 characters or more)"
          type="password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-slate-700">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Signing up..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-600 underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
