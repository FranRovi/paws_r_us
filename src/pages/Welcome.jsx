import { Link } from 'react-router-dom'
import OrangeBackground from '../components/OrangeBackground'
import PawLogo from '../components/PawLogo'

const buttonClass =
  'flex min-h-[60px] items-center justify-center rounded-2xl bg-brand px-6 text-xl font-extrabold text-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

export default function Welcome() {
    return (
        <OrangeBackground>
            <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-12 lg:flex-row">
                <section className="flex min-h-[560px] w-full max-w-[700px] flex-1 flex-col items-center justify-center gap-8 rounded-[62%_38%_52%_48%/52%_46%_54%_48%] bg-white px-8 py-14 text-center">
                <h1>
                    <PawLogo size="lg" />
                </h1>

                <p className="max-w-sm text-xl font-semibold italic leading-snug">
                    You can&apos;t buy love, but you can rescue it.
                </p>

                <nav aria-label="Get started" className="flex w-full max-w-sm flex-col gap-3.5">
                    <Link to="/login" className={buttonClass}>
                    Log In
                    </Link>
                    <Link to="/register" className={buttonClass}>
                    Create Account
                    </Link>
                </nav>
                </section>

                <div
                aria-hidden="true"
                className="hidden h-[600px] w-[520px] rounded-[52%_48%_40%_60%/48%_52%_48%_52%] bg-white/30 lg:block"
                />
            </main>
        </OrangeBackground>
    )
}