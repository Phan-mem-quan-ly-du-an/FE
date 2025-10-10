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

type Role = { id: number; code: string; name?: string | null; description?: string | null };

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

    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const [showTransfer, setShowTransfer] = useState(false);
    const [targetMember, setTargetMember] = useState<CompanyMember | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | "">("");
    const [transferring, setTransferring] = useState(false);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadMembers() {
        if (!companyId) {
            setMsg("Không xác định được Company ID");
            return;
        }
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
        if (!companyId) return;
        if (member.owner) {
            setMsg("Không thể xoá Owner");
            return;
        }
        if (!window.confirm(`Xoá thành viên ${member.userId} khỏi công ty?`)) return;

        try {
            setDeletingUserId(member.userId);
            const url = new URL(
                `/api/companies/${companyId}/members/${encodeURIComponent(member.userId)}`,
                base
            ).toString();
            const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
            if (!res.ok) {
                setMsg(`Xoá thất bại: ${res.status} ${await res.text()}`);
                return;
            }
            await loadMembers();
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi xoá");
        } finally {
            setDeletingUserId(null);
        }
    }

    async function openTransferModal(member: CompanyMember) {
        if (!companyId) return;
        if (member.owner) {
            setMsg("Thành viên này đã là Owner");
            return;
        }
        setMsg(null);
        setTargetMember(member);
        setSelectedDowngradeRoleId("");
        setShowTransfer(true);

        try {
            const rRes = await fetch(
                new URL(`/api/companies/${companyId}/roles?includeGlobal=true`, base).toString(),
                { headers: getAuthHeaders() }
            );
            if (!rRes.ok) {
                setMsg(`Lỗi tải roles: ${rRes.status} ${await rRes.text()}`);
                setRoles([]);
                return;
            }
            const rs: Role[] = await rRes.json();
            setRoles(Array.isArray(rs) ? rs : []);
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi tải roles");
            setRoles([]);
        }
    }

    function closeTransferModal() {
        setShowTransfer(false);
        setTargetMember(null);
        setRoles([]);
        setSelectedDowngradeRoleId("");
    }

    async function confirmTransfer() {
        if (!companyId || !targetMember) return;
        if (selectedDowngradeRoleId === "") {
            setMsg("Vui lòng chọn role cho Owner cũ (downgrade)");
            return;
        }

        setTransferring(true);
        setMsg(null);
        try {
            const url = new URL(
                `/api/companies/${companyId}/members/transfer-ownership`,
                base
            ).toString();
            const res = await fetch(url, {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    toUserId: targetMember.userId,
                    downgradeRoleId: selectedDowngradeRoleId,
                }),
            });
            if (!res.ok) {
                setMsg(`Transfer owner thất bại: ${res.status} ${await res.text()}`);
                return;
            }
            closeTransferModal();
            await loadMembers();
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi transfer owner");
        } finally {
            setTransferring(false);
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

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Row: Title / Actions top-right */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Company Members</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}/roles`} className="btn btn-primary">
                                Role &amp; Permission Management
                            </Link>
                            <button className="btn btn-primary">Add Member</button>
                            <button className="btn btn-secondary" onClick={() => navigate("/companies")}>
                                Back
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

                {/* Row: Table */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th style={{ width: 60 }}>#</th>
                                    <th>User ID</th>
                                    <th>Role ID</th>
                                    <th>Owner?</th>
                                    <th>Invited Email</th>
                                    <th>Joined At</th>
                                    <th style={{ width: 260 }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-5">
                                            No members
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((m, idx) => (
                                        <tr key={m.id}>
                                            <td>{idx + 1}</td>
                                            <td className="font-monospace">{m.userId}</td>
                                            <td>{m.owner ? <span className="badge bg-success">Owner</span> : (m.roleId ?? "—")}</td>
                                            <td>{m.owner ? "Yes" : "No"}</td>
                                            <td>{m.invitedEmail ?? "—"}</td>
                                            <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "—"}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <Link
                                                        className="btn btn-sm btn-outline-primary"
                                                        to={`/companies/${companyId}/members/${encodeURIComponent(m.userId)}/assign-role`}
                                                    >
                                                        Assign role
                                                    </Link>

                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(m)}
                                                        disabled={m.owner || deletingUserId === m.userId}
                                                    >
                                                        {deletingUserId === m.userId ? "Deleting..." : "Delete"}
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => openTransferModal(m)}
                                                        disabled={m.owner}
                                                        title="Transfer ownership"
                                                    >
                                                        Transfer owner
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Transfer ownership modal */}
                {showTransfer && (
                    <>
                        <div className="modal d-block" tabIndex={-1} role="dialog">
                            <div className="modal-dialog" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Transfer ownership</h5>
                                        <button type="button" className="btn-close" aria-label="Close" onClick={closeTransferModal} />
                                    </div>
                                    <div className="modal-body">
                                        <p className="mb-2">
                                            Chuyển quyền Owner cho: <span className="font-monospace">{targetMember?.userId}</span>
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label">Role cho Owner hiện tại (downgrade)</label>
                                            <select
                                                className="form-select"
                                                value={selectedDowngradeRoleId === "" ? "" : String(selectedDowngradeRoleId)}
                                                onChange={(e) =>
                                                    setSelectedDowngradeRoleId(e.target.value ? Number(e.target.value) : "")
                                                }
                                            >
                                                <option value="">— Chọn role —</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.code}
                                                        {r.name ? ` (${r.name})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text">
                                                Bạn phải chọn role để gán cho Owner cũ sau khi chuyển quyền.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={closeTransferModal} disabled={transferring}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary" onClick={confirmTransfer} disabled={transferring}>
                                            {transferring ? "Transferring..." : "Confirm Transfer"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* backdrop */}
                        <div className="modal-backdrop fade show"></div>
                    </>
                )}
            </div>
        </div>
    );
}
