import { Outlet } from "react-router-dom";
import Header from "./Header";
import OrangeBackground from "./OrangeBackground";

export default function AppLayout() {
  return (
    <OrangeBackground>
      <Header />
      <main className="mx-auto mb-12 mt-6 w-full max-w-[1440px] px-10">
        <Outlet />
      </main>
    </OrangeBackground>
  );
}
