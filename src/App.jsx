import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Profile from "./pages/Profile";
import PetDetail from "./pages/PetDetail";
import Favorites from "./pages/Favorites";
import Adoptions from "./pages/Adoptions";
import ScheduleVisit from "./pages/ScheduleVisit";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/adoptions" element={<Adoptions />} />
          <Route path="pets/:id" element={<PetDetail />} />
          <Route path="/adoptions/:applicationId/schedule" element={<ScheduleVisit />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
