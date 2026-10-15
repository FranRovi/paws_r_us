import PageCard from "../components/PageCard";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import ProfileForm from "../components/ProfileForm";

function memberSince(user) {
  if (!user?.created_at) return "";
  return new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading, error, save } = useProfile();

  if (loading) {
    return (
      <PageCard>
        <p role="status">Loading your profile…</p>
      </PageCard>
    );
  }

  if (error || !profile) {
    return (
      <PageCard>
        <p role="alert">{error || "We could not find your profile."}</p>
      </PageCard>
    );
  }

  const firstName = profile.first_name ?? "";

  return (
    <PageCard className="flex flex-wrap items-start gap-8">
      <aside
        aria-label="Your photo"
        className="flex w-[280px] flex-none flex-col items-center gap-4 rounded-[32px] bg-cream px-6 py-8 text-center"
      >
        <div className="flex size-[150px] items-center justify-center rounded-full bg-[#F3E8FB] text-[64px] font-extrabold">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-[22px] font-extrabold">Hello, {firstName}!</div>
          <div className="mt-1 text-sm text-muted">
            Member since {memberSince(user)}
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-[44px] items-center font-semibold underline"
        >
          Log out
        </button>
      </aside>

      <ProfileForm profile={profile} email={user.email} save={save} />

      {/* <form className="flex min-w-0 flex-[1_1_640px] flex-col gap-6">
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
              value={profile.first_name ?? ""}
              readOnly
            />
            <TextField
              label="Last name"
              value={profile.last_name ?? ""}
              readOnly
            />
            <TextField
              label="Username"
              value={profile.username ?? ""}
              readOnly
            />
            <TextField label="Email" value={user.email} readOnly />
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
            <TextField label="Address" value={profile.address ?? ""} readOnly />
            <TextField label="City" value={profile.city ?? ""} readOnly />
            <TextField label="Zip code" value={profile.zip ?? ""} readOnly />
            <TextField label="Country" value={profile.country ?? ""} readOnly />
          </div>
        </section>
      </form> */}
    </PageCard>
  );
}
