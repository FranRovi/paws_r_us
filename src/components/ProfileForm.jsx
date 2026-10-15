import { useState } from "react";
import { Link } from "react-router-dom";
import SelectField from "./SelectField";
import TextField from "./TextField";
import { COUNTRIES, HOME_TYPES, OTHER_PETS, TENURES } from "../lib/options";
import { validateProfile } from "../lib/validation";

const TEXT_KEYS = [
  "first_name",
  "last_name",
  "username",
  "address",
  "city",
  "zip",
];

const PREFS = [
  {
    name: "notify_appointments",
    label: "Email me about visit confirmations and changes",
  },
  {
    name: "notify_applications",
    label: "Email me when a shelter updates my application",
  },
  { name: "notify_messages", label: "Email me about new messages" },
];

function toValues(profile) {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    username: profile.username ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    zip: profile.zip ?? "",
    country: profile.country ?? COUNTRIES[0],
    home_type: profile.home_type ?? HOME_TYPES[0],
    tenure: profile.tenure ?? TENURES[0],
    other_pets: profile.other_pets ?? OTHER_PETS[0],
    notify_appointments: profile.notify_appointments ?? true,
    notify_applications: profile.notify_applications ?? true,
    notify_messages: profile.notify_messages ?? false,
  };
}

function clean(values) {
  const out = { ...values };
  TEXT_KEYS.forEach((key) => {
    out[key] = out[key].trim();
  });
  return out;
}

export default function ProfileForm({ profile, email, save }) {
  const [values, setValues] = useState(() => toValues(profile));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    const next = { ...values, [name]: type === "checkbox" ? checked : value };
    setValues(next);
    setSaved(false);
    if (submitted) setErrors(validateProfile(next));
  }

  function field(name) {
    return {
      name,
      value: values[name],
      onChange: handleChange,
      error: errors[name],
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateProfile(values);
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setFormError("");
    setSaved(false);

    const { error } = await save(clean(values));

    setSaving(false);
    if (error) {
      setFormError(
        error.code === "23505"
          ? "That username is already taken. Try a different one."
          : "We could not save your changes. Please try again.",
      );
      return;
    }
    setSaved(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-w-0 flex-[1_1_640px] flex-col gap-6"
    >
      <div>
        <h1 className="text-[40px] font-extrabold tracking-tight">
          Edit profile
        </h1>
        <p className="mt-1.5 text-base text-muted">
          Keep your details current so shelters can reach you and plan your
          visits.
        </p>
      </div>

      <section className="flex flex-col gap-[18px] rounded-[32px] bg-cream p-7">
        <h2 className="text-xl font-extrabold">About you</h2>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="First name"
            autoComplete="given-name"
            {...field("first_name")}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            {...field("last_name")}
          />
          <TextField
            label="Username"
            autoComplete="username"
            {...field("username")}
          />
          <TextField label="Email" value={email} readOnly />
        </div>
      </section>

      <section className="flex flex-col gap-[18px] rounded-[32px] bg-cream p-7">
        <div>
          <h2 className="text-xl font-extrabold">Your home</h2>
          <p className="mt-1 text-[13px] leading-normal text-muted">
            Shelters use this to check your home is a good fit during the home
            visit.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Address"
            autoComplete="street-address"
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
            {...field("country")}
          />
          <SelectField
            label="Home type"
            options={HOME_TYPES}
            {...field("home_type")}
          />
          <SelectField
            label="Do you own or rent?"
            options={TENURES}
            {...field("tenure")}
          />
          <SelectField
            label="Other pets at home"
            options={OTHER_PETS}
            {...field("other_pets")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-[32px] bg-cream p-7">
        <h2 className="mb-2 text-xl font-extrabold">Notifications</h2>
        {PREFS.map((pref) => (
          <label
            key={pref.name}
            className="flex min-h-[44px] items-center gap-3.5 text-base"
          >
            <input
              type="checkbox"
              name={pref.name}
              checked={values[pref.name]}
              onChange={handleChange}
              className="size-[22px] accent-brand"
            />
            {pref.label}
          </label>
        ))}
      </section>

      {formError && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3.5">
        <button
          type="submit"
          disabled={saving}
          className="min-h-[60px] rounded-2xl bg-brand px-9 text-lg font-extrabold text-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <Link
          to="/explore"
          className="flex min-h-[60px] items-center rounded-2xl border-2 border-text px-7 font-semibold"
        >
          Cancel
        </Link>
        {saved && (
          <span
            role="status"
            className="flex items-center gap-2 rounded-full bg-cream px-5 py-3 font-extrabold"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
            Profile saved
          </span>
        )}
      </div>
    </form>
  );
}
