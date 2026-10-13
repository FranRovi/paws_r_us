import PawLogo from "./components/PawLogo";

export default function App() {
  return (
    <>
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-10">
        <h1>
          <PawLogo size="lg" />
        </h1>
        <PawLogo size="md" />
        <PawLogo size="sm" />
      </main>
    </>
  );
}
