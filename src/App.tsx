/* eslint-disable @typescript-eslint/no-unused-vars */
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import OidcCallback from "./pages/auth/OidcCallback";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AccountPage from "./pages/account/AccountPage.tsx";
import ChangePasswordPage from "./pages/account/ChangePasswordPage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<OidcCallback />} />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="account/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;