import type { ReactNode } from "react";
import { useAuth } from "react-oidc-context";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <p>Đang kiểm tra phiên…</p>;
  }

  if (!auth.isAuthenticated) {
    return <p>Bạn chưa đăng nhập.</p>;
  }

  return <>{children}</>;
}

