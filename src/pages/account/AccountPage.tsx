import { useAuth } from "react-oidc-context";
import { Link, useNavigate } from "react-router-dom";

function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const email = auth.user?.profile?.email as string | undefined;
  const name = (auth.user?.profile?.name as string | undefined) ;
  const gender = auth.user?.profile?.gender as string | undefined;

  return (
    <div>
      <h2>Thông tin tài khoản</h2>
      <div>
        <div><strong>Email:</strong> {email || "-"}</div>
        <div><strong>Tên:</strong> {name || "-"}</div>
        <div><strong>Giới tính:</strong> {gender || "-"}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="nav-button" onClick={() => navigate("/account/change-password")}>Đổi mật khẩu</button>
        <Link to="/">Về Trang chủ</Link>
      </div>
    </div>
  );
}

export default AccountPage;

