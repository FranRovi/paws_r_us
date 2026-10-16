import { Outlet } from "react-router-dom";
import Header from "./Header";
import OrangeBackground from "./OrangeBackground";
import FavoritesProvider from "../context/FavoritesProvider";
import AppplicationsProvider from "../context/ApplicationsProvider";
import { AppointmentsProvider } from "../context/AppointmentsProvider";

export default function AppLayout() {
  return (
    <OrangeBackground>
      <Header />
      <main className="mx-auto mb-12 mt-6 w-full max-w-[1440px] px-10">
        <FavoritesProvider>
          <AppplicationsProvider>
            <AppointmentsProvider>
              <Outlet />
            </AppointmentsProvider>
          </AppplicationsProvider>
        </FavoritesProvider>
      </main>
    </OrangeBackground>
  );
}
