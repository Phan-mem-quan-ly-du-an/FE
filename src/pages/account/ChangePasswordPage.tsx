import { useState } from "react";
import { Link } from "react-router-dom";

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    // Yêu cầu: >=8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError("Mật khẩu mới phải ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      // TODO: Thay bằng gọi API thật sự. Ví dụ:
      // await api.changePassword({ currentPassword, newPassword })

      // DEMO: giả lập sai mật khẩu hiện tại
      const isCurrentPasswordValid = currentPassword === "correct-demo";
      if (!isCurrentPasswordValid) {
        const err = new Error("INVALID_CURRENT_PASSWORD");
        // @ts-expect-error demo error code
        err.code = "INVALID_CURRENT_PASSWORD";
        throw err;
      }

      setMessage("Đổi mật khẩu thành công (demo)");
    } catch (e: unknown) {
      const errorObj = e as { code?: string; message?: string };
      if (errorObj?.code === "INVALID_CURRENT_PASSWORD") {
        setError("Mật khẩu hiện tại không đúng");
      } else {
        setError("Đổi mật khẩu thất bại. Vui lòng thử lại");
      }
    }
  };

  return (
    <div>
      <h2>Đổi mật khẩu</h2>
      <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Mật khẩu hiện tại</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Mật khẩu mới</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Nhập lại mật khẩu mới</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button className="nav-button" type="submit">Lưu mật khẩu</button>
      </form>
      {error && <div style={{ marginTop: 10, color: "#ff6b6b" }}>{error}</div>}
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
      <div style={{ marginTop: 12 }}>
        <Link to="/account">Quay lại trang tài khoản</Link>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

