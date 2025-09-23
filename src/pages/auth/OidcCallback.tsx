import { useAuth } from "react-oidc-context";

export default function OidcCallback() {
  const auth = useAuth();

  if (auth.isLoading) return <p>Đang xử lý đăng nhập…</p>;
  if (auth.error) return <p>Lỗi: {auth.error.message}</p>;
  return <p>Đăng nhập thành công! Đang chuyển hướng…</p>;
}

