import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router-dom";

function LoginPage() {
  const auth = useAuth();

  // Tự động chuyển hướng đến trang đăng nhập khi truy cập /login
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator]);

  const signOutRedirect = async () => {
    try {
      await auth.signoutRedirect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      await auth.removeUser();
    }
  };

  if (auth.isLoading || auth.activeNavigator === "signinRedirect") {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return (
      <div>
        Đã xảy ra lỗi... {auth.error.message}
        <button onClick={() => signOutRedirect()}>Đăng xuất</button>
      </div>
    );
  }

  // Nếu người dùng đã xác thực, hiển thị thông tin của họ
  if (auth.isAuthenticated) {
    return (
      <div>
        <h2>Chào mừng trở lại!</h2>
        <pre> Xin chào: {auth.user?.profile.email} </pre>
        <pre> Tên của bạn: {auth.user?.profile.name} </pre>
        <button onClick={() => signOutRedirect()}>Đăng xuất</button>
        <Link to="/">Về Trang chủ</Link>
      </div>
    );
  }

  return <div>Đang chuyển hướng đến trang đăng nhập…</div>;
}

export default LoginPage;