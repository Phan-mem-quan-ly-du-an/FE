
import "../../assets/css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";


function Header() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // Điều hướng tới trang Login để bắt đầu flow đăng nhập
    navigate("/login");
  };

  const handleLogoutClick = async () => {
    try {
      // Xóa thông tin người dùng lưu bởi oidc-client để tránh tự đăng nhập lại khi reload
      await auth.removeUser();
    } catch {
      // no-op
    }
    const logoutUri = window.location.origin; // e.g., http://localhost:5173
    const cognitoLogoutUrl = `https://us-east-1tw7vcnpwd.auth.us-east-1.amazoncognito.com/logout?client_id=776adgova674q688i3q1euf2f0&logout_uri=${encodeURIComponent(logoutUri)}`;
    window.location.replace(cognitoLogoutUrl);
  };

  const displayName = auth.user?.profile?.name || auth.user?.profile?.email || "Tài khoản";

  const goToAccount = () => navigate("/account");
  return (
    <header className="header">
      <div className="logo">MyApp</div>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {auth.isAuthenticated ? (
          <div className="user-menu">
            <button className="nav-button user-trigger">{displayName}</button>
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={goToAccount}>Tài khoản của bạn</button>
              <button className="dropdown-item" onClick={handleLogoutClick}>Đăng xuất</button>
            </div>
          </div>
        ) : (
          <button className="nav-button" onClick={handleLoginClick}>Đăng nhập</button>
        )}
      </nav>
    </header>
  );
}

export default Header;
