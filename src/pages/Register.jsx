import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PawLogo from '../components/PawLogo'
import TextField from '../components/TextField'
import SelectField from '../components/SelectField'

const COUNTRIES = ['United States', 'Canada', 'Argentina']

export default function Register() {
  return (
    <AuthLayout className="max-w-[720px]">
      <div className="flex flex-col gap-7">
        <div className="flex justify-center">
          <PawLogo size="md" />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight">Create account</h1>

        <form className="flex flex-col gap-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" name="firstName" autoComplete="given-name" />
            <TextField label="Last name" name="lastName" autoComplete="family-name" />
            <TextField label="Username" name="username" autoComplete="username" />
            <TextField label="Email" name="email" type="email" autoComplete="email" />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
            />
            <TextField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
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
                name="address"
                autoComplete="street-address"
                className="sm:col-span-2"
              />
              <TextField label="City" name="city" autoComplete="address-level2" />
              <TextField label="Zip code" name="zip" autoComplete="postal-code" />
              <SelectField
                label="Country"
                name="country"
                options={COUNTRIES}
                className="sm:col-span-2"
              />
            </div>
          </fieldset>

          <label className="flex min-h-11 items-center gap-3.5 text-base">
            <input type="checkbox" name="terms" className="h-5 w-5 accent-brand" />I agree to the terms of use
          </label>

          <button
            type="submit"
            className="min-h-[60px] rounded-2xl bg-brand text-xl font-extrabold text-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-[15px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-extrabold text-text underline">
            Log In
          </Link>
        </p>
        <Link to="/" className="self-center text-sm font-semibold text-muted underline">
          Back to welcome
        </Link>
      </div>
    </AuthLayout>
  )
}