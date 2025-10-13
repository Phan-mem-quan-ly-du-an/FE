// src/pages/Company/AssignRolePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router-dom";

type Role = { id: number; code: string; name?: string | null; description?: string | null };
type MemberSummary = { userId: string; roleId?: number | null; owner: boolean };

export default function AssignRolePage() {
    const auth = useAuth();
    const navigate = useNavigate();

    const { companyId: companyIdParam, memberId: memberIdParam } =
        useParams<{ companyId: string; memberId: string }>();

    const companyId = useMemo(() => companyIdParam || "", [companyIdParam]);
    // memberId trên URL = userId (có thể có ký tự đặc biệt)
    const memberId = useMemo(
        () => (memberIdParam ? decodeURIComponent(memberIdParam) : ""),
        [memberIdParam]
    );

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [roles, setRoles] = useState<Role[]>([]);
    const [member, setMember] = useState<MemberSummary | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadAll() {
        if (!companyId || !memberId) {
            setMsg("Thiếu Company ID hoặc Member ID");
            setLoading(false);
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            // Lấy list members rồi tìm theo userId
            const listRes = await fetch(
                new URL(`/api/companies/${companyId}/members`, base).toString(),
                { headers: getAuthHeaders() }
            );
            if (!listRes.ok) {
                setMsg(`Lỗi tải danh sách thành viên: ${listRes.status} ${await listRes.text()}`);
                setLoading(false);
                return;
            }
            const list: MemberSummary[] = await listRes.json();
            const found = (list || []).find((x) => x.userId === memberId) || null;
            if (!found) {
                setMsg("Không tìm thấy thành viên trong công ty này");
                setLoading(false);
                return;
            }
            setMember(found);
            setSelectedRoleId(found.roleId ?? "");

            const rRes = await fetch(
                new URL(`/api/companies/${companyId}/roles?includeGlobal=true`, base).toString(),
                { headers: getAuthHeaders() }
            );
            if (!rRes.ok) {
                setMsg(`Lỗi tải roles: ${rRes.status} ${await rRes.text()}`);
                setLoading(false);
                return;
            }
            const rs: Role[] = await rRes.json();
            setRoles(Array.isArray(rs) ? rs : []);
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, companyId, memberId]);

    async function save() {
        if (!companyId || !memberId) return;
        if (!member) return;

        // Không cho assign role cho Owner – buộc dùng transfer ownership
        if (member.owner) {
            setMsg("Không thể gán role cho Owner. Hãy dùng Transfer ownership.");
            return;
        }
        if (selectedRoleId === "") {
            setMsg("Vui lòng chọn Role");
            return;
        }

        setSaving(true);
        setMsg(null);
        try {
            const url = new URL(
                `/api/companies/${companyId}/members/${encodeURIComponent(memberId)}/role`,
                base
            ).toString();
            const res = await fetch(url, {
                method: "PUT",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ roleId: selectedRoleId }),
            });
            if (!res.ok) {
                setMsg(`Gán role thất bại: ${res.status} ${await res.text()}`);
                return;
            }
            navigate(`/companies/${companyId}`);
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi lưu");
        } finally {
            setSaving(false);
        }
    }

    if (auth.isLoading) return <div className="container">Đang kiểm tra phiên đăng nhập...</div>;
    if (!auth.isAuthenticated || !auth.user?.id_token) {
        return (
            <div className="container">
                <p>Bạn chưa đăng nhập.</p>
                <button className="btn btn-primary" onClick={() => auth.signinRedirect?.()}>
                    Đăng nhập
                </button>
            </div>
        );
    }
    if (loading) return <div className="container">Loading...</div>;
    if (!member) return <div className="container">Không tìm thấy thành viên</div>;

    const isOwner = !!member.owner;

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Row: Title + Back + Save */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Assign Role</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}`} className="btn btn-secondary">
                                Back
                            </Link>
                            <button className="btn btn-primary" onClick={save} disabled={saving || isOwner}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row: Message */}
                {msg && (
                    <div className="row">
                        <div className="col-12">
                            <div className="alert alert-info mt-3 mb-0">{msg}</div>
                        </div>
                    </div>
                )}

                {/* Row: Member info */}
                <div className="row mt-3">
                    <div className="col-12 col-lg-8 col-xl-6">
                        {isOwner && (
                            <div className="alert alert-warning">
                                Thành viên này đang là <strong>Owner</strong>. Bạn không thể gán role. Vui lòng dùng{" "}
                                <strong>Transfer ownership</strong> từ trang Members.
                            </div>
                        )}

                        <div className="table-responsive">
                            <table className="table table-bordered align-middle">
                                <tbody>
                                <tr>
                                    <th style={{ width: 180 }}>Member (userId)</th>
                                    <td className="font-monospace">{member.userId}</td>
                                </tr>
                                <tr>
                                    <th>Current</th>
                                    <td>{member.owner ? "Owner" : (member.roleId ?? "—")}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                disabled={isOwner}
                                value={selectedRoleId === "" ? "" : String(selectedRoleId)}
                                onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : "")}
                            >
                                <option value="">— Select role —</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.code}
                                        {r.name ? ` (${r.name})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-muted small">Chọn role và bấm Save để gán cho thành viên.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
