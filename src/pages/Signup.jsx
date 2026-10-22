
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Added: Validation and password visibility
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Added: Successful signup screen
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  // Added: First and last name validation
  const nameParts = name.trim().split(/\s+/);
  const isValidName =
    nameParts.length >= 2 &&
    nameParts.every((part) => part.length >= 2);

  // Added: Email format validation
  const isValidEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Added: Five password requirements
  const requirements = [
    { label: "8 Characters", valid: password.length >= 8 },
    { label: "A-Z", valid: /[A-Z]/.test(password) },
    { label: "a-z", valid: /[a-z]/.test(password) },
    { label: "123", valid: /[0-9]/.test(password) },
    { label: "@#$", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const strength = requirements.filter((rule) => rule.valid).length;
  const isStrong = strength === 5;

  const strengthColor = isStrong
    ? "bg-green-500"
    : strength >= 3
      ? "bg-amber-500"
      : "bg-red-500";

  const strengthText = isStrong
    ? "Strong"
    : strength >= 3
      ? "Medium"
      : "Weak";

  const canSubmit = isValidName && isValidEmail && isStrong && !busy;

  // Updated: Supabase signup with validation
  async function handleSubmit(e) {
    e.preventDefault();

    if (!canSubmit) {
      setNameTouched(true);
      setEmailTouched(true);
      setError("Please enter a valid full name, email, and strong password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { data, error: signUpError } = await signUp(
        email.trim(),
        password,
        name.trim()
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data?.user) {
        setError("Registration could not be confirmed. Please try again.");
        return;
      }

      const requiresEmailConfirmation = !data.session;

      setNeedsConfirmation(requiresEmailConfirmation);
      setSignupSuccess(true);

      if (!requiresEmailConfirmation) {
        redirectTimer.current = setTimeout(() => {
          navigate("/");
        }, 2500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Added: Green welcome screen after successful signup
  if (signupSuccess) {
    return (
      <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-emerald-100 bg-white px-6 py-14 text-center shadow-xl">
        {/* Animated confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="signup-confetti absolute -top-5 h-3 w-2 rounded-sm"
              style={{
                left: `${(i * 37) % 100}%`,
                backgroundColor: [
                  "#10b981",
                  "#f59e0b",
                  "#fb7185",
                  "#38bdf8",
                  "#a78bfa",
                ][i % 5],
                animationDelay: `${(i % 8) * 0.18}s`,
                animationDuration: `${2 + (i % 4) * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Animated green checkmark */}
        <div className="signup-success-check relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12l4 4L19 6" />
          </svg>
        </div>

        <h1 className="relative text-3xl font-extrabold text-slate-900">
          Welcome to CampusConnect!
        </h1>

        <p className="relative mt-3 text-lg font-semibold text-emerald-700">
          {name.trim()}
        </p>

        <p className="relative mt-4 text-slate-600">
          {needsConfirmation
            ? "Your signup request was received. Please check your email and confirm your account before logging in."
            : "Your account was created successfully!"}
        </p>

        <p className="relative mt-3 text-sm font-medium text-emerald-700">
          {needsConfirmation
            ? "Once confirmed, you can log in and explore campus events."
            : "Taking you to CampusConnect..."}
        </p>

        {needsConfirmation && (
          <Link
            to="/login"
            className="relative mt-6 inline-block rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Go to Login
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Create your account
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        {/* Full name */}
        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm font-semibold text-slate-700">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 outline-none transition ${
              nameTouched || name
                ? isValidName
                  ? "border-green-500 focus:ring-2 focus:ring-green-200"
                  : "border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-300 focus:ring-2 focus:ring-emerald-200"
            }`}
          />
          {(nameTouched || name) && (
            <p className={`mt-2 text-sm ${isValidName ? "text-green-600" : "text-red-500"}`}>
              {isValidName
                ? "✓ Full name looks good!"
                : "Enter your full name (first and last name)."}
            </p>
          )}
        </div>

        {/* Email address */}
        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="123@gmail.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 outline-none transition ${
              emailTouched || email
                ? isValidEmail
                  ? "border-green-500 focus:ring-2 focus:ring-green-200"
                  : "border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-300 focus:ring-2 focus:ring-emerald-200"
            }`}
          />
          {(emailTouched || email) && (
            <p className={`mt-2 text-sm ${isValidEmail ? "text-green-600" : "text-red-500"}`}>
              {isValidEmail
                ? "✓ Email format looks good!"
                : "Please enter a valid email address."}
            </p>
          )}
        </div>

        {/* Password with show/hide toggle */}
        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>

          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={`w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 outline-none transition ${
                isStrong
                  ? "border-green-500 focus:ring-2 focus:ring-green-200"
                  : strength >= 3
                    ? "border-amber-500 focus:ring-2 focus:ring-amber-200"
                    : "border-red-400 focus:ring-2 focus:ring-red-100"
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Password strength */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">Password Strength</span>
            <span
              className={`font-bold ${
                isStrong
                  ? "text-green-600"
                  : strength >= 3
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {password ? strengthText : "Not entered"}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
              style={{ width: `${strength * 20}%` }}
            />
          </div>

          {/* Five password requirements */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
            {requirements.map((rule) => (
              <div
                key={rule.label}
                className={`flex items-center gap-1.5 text-sm font-medium ${
                  rule.valid ? "text-green-600" : "text-red-400"
                }`}
              >
                <span>{rule.valid ? "✓" : "○"}</span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>

          {isStrong && (
            <p className="mt-3 text-sm font-medium text-green-600">
              ✓ All password requirements satisfied!
            </p>
          )}
        </div>

        {/* Supabase error messages */}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Submit only when validation passes */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-emerald-700 underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
