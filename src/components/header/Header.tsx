import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

function Header() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // Điều hướng tới trang Login để bắt đầu flow đăng nhập
    navigate("/login");
  };

  const handleLogoutClick = () => {
    auth.signoutRedirect();
  };
  return (
    <header className="header">
      <div className="logo">MyApp</div>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {auth.isAuthenticated ? (
          <button onClick={handleLogoutClick}>Đăng xuất</button>
        ) : (
          <button onClick={handleLoginClick}>Đăng nhập</button>
        )}
      </nav>
    </header>
  );
}

export default Header;
