import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams, useNavigate } from "react-router-dom";

type CompanyMember = {
    id: number;
    companyId: string;
    userId: string;
    roleId?: number | null;
    invitedEmail?: string | null;
    invitedBy?: string | null;
    joinedAt?: string | null;
    owner: boolean;
};

export default function CompanyMemberPage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const params = useParams();

    const companyId = useMemo(() => {
        return (
            (params as any).companyId ||
            (params as any).id ||
            window.location.pathname.match(/\/companies\/([^/]+)/)?.[1] ||
            ""
        );
    }, [params]);

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [rows, setRows] = useState<CompanyMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadMembers() {
        if (!companyId) { setMsg("Không xác định được Company ID"); return; }
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(new URL(`/api/companies/${companyId}/members`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Lỗi tải danh sách: ${res.status} ${t}`);
                return;
            }
            const data: CompanyMember[] = await res.json();
            setRows(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi tải danh sách");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        loadMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, companyId]);

    async function handleDelete(member: CompanyMember) {
        if (!companyId || !member?.id) return;
        if (member.owner) { setMsg("Không thể xoá Owner"); return; }
        if (!window.confirm("Xoá thành viên này khỏi công ty?")) return;

        try {
            setLoading(true);
            const res = await fetch(
                new URL(`/api/companies/${companyId}/members/${member.id}`, base).toString(),
                { method: "DELETE", headers: getAuthHeaders() }
            );
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Xoá thất bại: ${res.status} ${t}`);
                return;
            }
            await loadMembers();
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi xoá");
        } finally {
            setLoading(false);
        }
    }

    if (auth.isLoading) return <div className="container">Đang kiểm tra phiên đăng nhập...</div>;
    if (!auth.isAuthenticated || !auth.user?.id_token) {
        return (
            <div className="container">
                <p>Bạn chưa đăng nhập.</p>
                <button className="btn btn-primary" onClick={() => auth.signinRedirect?.()}>Đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* Row: Title / Actions top-right */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Company Members</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}/roles`} className="btn btn-primary">
                                Role &amp; Permission
                            </Link>
                            <button className="btn btn-secondary" onClick={() => navigate("/companies")}>Back</button>
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

                {/* Row: Table */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th style={{width:60}}>#</th>
                                    <th>User ID</th>
                                    <th>Role ID</th>
                                    <th>Owner?</th>
                                    <th>Invited Email</th>
                                    <th>Joined At</th>
                                    <th style={{width:220}}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading && (
                                    <tr><td colSpan={7} className="text-center py-5">Loading...</td></tr>
                                )}
                                {!loading && rows.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-muted py-5">No members</td></tr>
                                )}
                                {!loading && rows.map((m, idx) => (
                                    <tr key={m.id}>
                                        <td>{idx + 1}</td>
                                        <td className="font-monospace">{m.userId}</td>
                                        <td>{m.owner ? <span className="badge bg-success">Owner</span> : (m.roleId ?? "—")}</td>
                                        <td>{m.owner ? "Yes" : "No"}</td>
                                        <td>{m.invitedEmail ?? "—"}</td>
                                        <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "—"}</td>
                                        <td>
                                            <div className="btn-group">
                                                {/* route edit member tuỳ bạn định nghĩa: /companies/:companyId/members/:memberId/edit */}
                                                <Link
                                                    className="btn btn-sm btn-outline-primary"
                                                    to={`/companies/${companyId}/members/${m.id}/edit`}
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(m)}
                                                    disabled={loading || m.owner}
                                                >
                                                    Delete
                                                </button>
                                                {/* bạn có thể thêm các action khác: View / Assign Role ... */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
