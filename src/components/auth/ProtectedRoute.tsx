import { ReactNode, useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth]);

  if (auth.isLoading || auth.activeNavigator === "signinRedirect") {
    return <p>Đang chuyển hướng đăng nhập…</p>;
  }

  if (!auth.isAuthenticated) return null;

  return <>{children}</>;
}

