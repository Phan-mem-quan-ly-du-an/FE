import React, { useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { changePassword } from "helpers/account/changePassword";

const fieldOrEmpty = (v?: string) => (v ? v : "");

export default function AccountPage() {
    const auth = useAuth();
    const [showPwd, setShowPwd] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const profile = (auth.user?.profile ?? {}) as Record<string, any>;

    const userName = fieldOrEmpty(profile.email);
    const displayName = useMemo(() => {
        const gn = fieldOrEmpty(profile.given_name);
        const fn = fieldOrEmpty(profile.family_name);
        const combined = `${gn} ${fn}`.trim();
        if (combined) return combined;
        return fieldOrEmpty(profile.name) || userName;
    }, [profile, userName]);

    const genderLabel =
        (profile.gender as string)?.toLowerCase() === "male"
            ? "Male"
            : (profile.gender as string)?.toLowerCase() === "female"
                ? "Female"
                : "";

    const initials = useMemo(() => {
        const src = displayName || userName || "U";
        const parts = src.split(" ").filter(Boolean);
        const first = parts[0]?.[0] ?? "U";
        const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
        return (first + last).toUpperCase();
    }, [displayName, userName]);

    const canChangePassword = !!auth.user?.access_token;

    const onSubmitChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        if (newPassword !== confirmPassword) {
            setMsg({ type: "error", text: "New password and confirmation do not match." });
            return;
        }
        if (!auth.user?.access_token) {
            setMsg({ type: "error", text: "Missing access token. Please sign in again." });
            return;
        }

        try {
            setBusy(true);
            await changePassword(auth.user.access_token, currentPassword, newPassword);
            setMsg({ type: "success", text: "Password changed successfully." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPwd(false);
        } catch (err: any) {
            const text =
                err?.message ||
                err?.name ||
                "Failed to change password. Please check your current password and try again.";
            setMsg({ type: "error", text });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Header row */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Account</h4>
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => setShowPwd((v) => !v)}
                                disabled={!canChangePassword}
                                title={!canChangePassword ? "Missing access token" : "Change your password"}
                            >
                                {showPwd ? "Close Password Form" : "Change Password"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info / Messages */}
                {msg && (
                    <div className="row mt-3">
                        <div className="col-12">
                            <div
                                className={`alert ${msg.type === "success" ? "alert-success" : "alert-danger"} mb-0`}
                                role="alert"
                            >
                                {msg.text}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="row mt-3">
                    {/* Profile card */}
                    <div className="col-12 col-lg-6">
                        <div className="card h-100">
                            <div className="card-body d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: 64,
                                        height: 64,
                                        background: "var(--bs-gray-200)",
                                        fontWeight: 600,
                                        fontSize: 20,
                                    }}
                                    aria-label="avatar"
                                >
                                    {initials}
                                </div>
                                <div>
                                    <h5 className="mb-1">{displayName}</h5>
                                    <div className="text-muted">{userName}</div>
                                </div>
                            </div>

                            <div className="card-body border-top">
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <div className="mb-1 text-muted small">User name (email)</div>
                                        <div className="fw-medium">{userName || "-"}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <div className="mb-1 text-muted small">Display name</div>
                                        <div className="fw-medium">{displayName || "-"}</div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <div className="mb-1 text-muted small">Gender</div>
                                        <div className="fw-medium">{genderLabel || "-"}</div>
                                    </div>
                                </div>
                            </div>

                            {showPwd && (
                                <div className="card-body border-top">
                                    <form onSubmit={onSubmitChangePassword}>
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label">Current password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                    autoComplete="current-password"
                                                />
                                            </div>
                                            <div className="col-12 col-md-6" />
                                            <div className="col-12 col-md-6">
                                                <label className="form-label">New password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label">Confirm new password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div className="col-12 d-flex align-items-center gap-2">
                                                <button type="submit" className="btn btn-primary" disabled={busy}>
                                                    {busy ? "Changing..." : "Confirm change"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-link"
                                                    onClick={() => setShowPwd(false)}
                                                    disabled={busy}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session card */}
                    <div className="col-12 col-lg-6 mt-3 mt-lg-0">
                        <div className="card h-100">
                            <div className="card-body">
                                <h6 className="text-muted text-uppercase mb-3">Session</h6>
                                <div className="small text-break">
                                    <div className="text-muted mb-1">Id token (truncated)</div>
                                    <code className="d-block">{auth.user?.id_token as string}</code>
                                </div>
                                    <div className="small text-break mt-3">
                                      <div className="text-muted mb-1">Access token (truncated)</div>
                                      <code className="d-block">
                                        {auth.user?.access_token as string}
                                      </code>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
