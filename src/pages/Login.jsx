import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PawLogo from "../components/PawLogo";
import TextField from "../components/TextField";
import { useAuth } from "../hooks/useAuth";
import { validateLogin } from "../lib/validation";
import { friendlyLoginError } from "../lib/authErrors";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/explore";

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function handleChange(event) {
    const next = { ...values, [event.target.name]: event.target.value };
    setValues(next);
    if (submitted) setErrors(validateLogin(next));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");

    const { error } = await signIn({
      email: values.email.trim(),
      password: values.password,
    });

    setSubmitting(false);

    if (error) {
      setFormError(friendlyLoginError(error));
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthLayout className="max-w-[480px]">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-4">
          <PawLogo size="md" />
          <h1 className="text-3xl font-extrabold tracking-tight">Log in</h1>
        </div>

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[60px] rounded-2xl bg-brand text-xl font-extrabold text-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log In"}
        </button>

        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link to="/register" className="font-extrabold text-text underline">
            Create an account
          </Link>
          {" · "}
          <Link to="/" className="font-extrabold text-text underline">
            Back to welcome
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
