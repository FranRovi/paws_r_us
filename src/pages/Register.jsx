import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PawLogo from "../components/PawLogo";
import TextField from "../components/TextField";
import SelectField from "../components/SelectField";
import { validateRegister } from "../lib/validation";
import { useAuth } from "../hooks/useAuth";
import { friendlyAuthError } from "../lib/authErrors";

const COUNTRIES = ["United States", "Canada", "Argentina"];

const INITIAL_VALUES = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  zip: "",
  country: "United States",
  terms: false,
};

export default function Register() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    const next = { ...values, [name]: type === "checkbox" ? checked : value };
    setValues(next);
    if (submitted) setErrors(validateRegister(next));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateRegister(values);
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");

    const { data, error } = await signUp({
      email: values.email.trim(),
      password: values.password,
      profile: {
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        username: values.username.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        zip: values.zip.trim(),
        country: values.country,
      },
    });

    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }

    if (data.session) {
      navigate("/explore", { replace: true });
    } else {
      setNeedsConfirmation(true);
    }
  }

  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    error: errors[name],
  });
  if (needsConfirmation) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-6 text-center">
          <PawLogo size="md" />
          <h1 className="text-3xl font-extrabold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted">
            We sent a confirmation link to {values.email}. Open it to finish
            creating your account.
          </p>
          <Link to="/login" className="font-extrabold underline">
            Go to Log In
          </Link>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout className="max-w-[720px]">
      <div className="flex flex-col gap-7">
        <div className="flex justify-center">
          <PawLogo size="md" />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          Create account
        </h1>

        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="First name"
              autoComplete="given-name"
              {...field("firstName")}
            />
            <TextField
              label="Last name"
              autoComplete="family-name"
              {...field("lastName")}
            />
            <TextField
              label="Username"
              autoComplete="username"
              {...field("username")}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              {...field("email")}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              {...field("password")}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              {...field("confirmPassword")}
            />
          </div>

          <fieldset className="flex flex-col gap-4 rounded-3xl bg-cream p-6">
            <legend className="sr-only">Your home</legend>
            <div>
              <h2 className="text-xl font-extrabold">Your home</h2>
              <p className="mt-1 text-sm text-muted">
                Shelters use your address to plan the home visit.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Address"
                autoComplete="street-address"
                className="sm:col-span-2"
                {...field("address")}
              />
              <TextField
                label="City"
                autoComplete="address-level2"
                {...field("city")}
              />
              <TextField
                label="Zip code"
                autoComplete="postal-code"
                {...field("zip")}
              />
              <SelectField
                label="Country"
                options={COUNTRIES}
                className="sm:col-span-2"
                name="country"
                value={values.country}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-1">
            <label className="flex min-h-11 items-center gap-3.5 text-base">
              <input
                type="checkbox"
                name="terms"
                checked={values.terms}
                onChange={handleChange}
                className="h-5 w-5 accent-brand"
              />
              I agree to the terms of use
            </label>
            {errors.terms && (
              <p className="text-sm font-semibold text-red-700">
                {errors.terms}
              </p>
            )}
          </div>

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
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-[15px] text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-extrabold text-text underline">
            Log In
          </Link>
        </p>
        <Link
          to="/"
          className="self-center text-sm font-semibold text-muted underline"
        >
          Back to welcome
        </Link>
      </div>
    </AuthLayout>
  );
}
