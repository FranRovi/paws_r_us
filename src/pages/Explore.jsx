import PageCard from "../components/PageCard";
import { useAuth } from "../hooks/useAuth";

export default function Explore() {
  const { user, signOut } = useAuth();

  return (
    <PageCard>
      <h1 className="text-[40px] font-extrabold tracking-tight">Explore</h1>
      <p>Logged in as {user.email}</p>
      <button
        type="button"
        onClick={signOut}
        className="mt-4 min-h-[44px] rounded-2xl bg-brand px-6 font-extrabold text-ink"
      >
        Log out
      </button>
    </PageCard>
  );
}
