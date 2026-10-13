import PawLogo from "./components/PawLogo";
import OrangeBackground from "./components/OrangeBackground";

export default function App() {
  return (
    <OrangeBackground>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex justify-center rounded-card bg-white p-10">
          <h1>
            <PawLogo size="lg" />
          </h1>
        </div>
      </main>
    </OrangeBackground>
  )
}
