import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AUTH_LOGOUT_EVENT } from "@/lib/httpClient";
import LoginPage from "@/pages/Login";
import HomePage from "@/pages/Home";
import ServicesListPage from "@/pages/Services";
import DentistsListPage from "@/pages/Dentists";
import DentistPricesPage from "@/pages/DentistPrices";
import SettingsPage from "@/pages/Settings";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate("/login", { replace: true });
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesListPage />} />
          <Route path="/dentists" element={<DentistsListPage />} />
          <Route path="/dentists/:id/prices" element={<DentistPricesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
