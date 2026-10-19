import { Outlet } from "react-router-dom";
import Header from "./Header";
import OrangeBackground from "./OrangeBackground";
import FavoritesProvider from "../context/FavoritesProvider";
import ApplicationsProvider from "../context/ApplicationsProvider";
import { AppointmentsProvider } from "../context/AppointmentsProvider";
import NotificationsProvider from "../context/NotificationsProvider";
import MessagesProvider from "../context/MessagesProvider";

export default function AppLayout() {
  return (
    <OrangeBackground>
      <NotificationsProvider>
        <Header />
        <main className="mx-auto mb-12 mt-6 w-full max-w-[1440px] px-10">
          <FavoritesProvider>
            <ApplicationsProvider>
              <AppointmentsProvider>
                <MessagesProvider>
                  <Outlet />
                </MessagesProvider>
              </AppointmentsProvider>
            </ApplicationsProvider>
          </FavoritesProvider>
        </main>
      </NotificationsProvider>
    </OrangeBackground>
  );
}
