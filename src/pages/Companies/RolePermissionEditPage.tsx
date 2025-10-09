import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";

type Permission = {
    id: number;
    scope: "company" | "workspace" | "project";
    code: string;
    name: string;
};

export default function RolePermissionEditPage() {
    const auth = useAuth();
    const params = useParams();

    const companyId = useMemo(
        () =>
            (params as any).companyId ||
            (params as any).id ||
            window.location.pathname.match(/\/companies\/([^/]+)/)?.[1] ||
            "",
        [params]
    );
    const roleIdStr = useMemo(
        () =>
            (params as any).roleId ||
            (params as any).id2 ||
            window.location.pathname.match(/\/roles\/([^/]+)$/)?.[1] ||
            "",
        [params]
    );
    const roleId = Number(roleIdStr);

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadAll() {
        if (!companyId || !roleId) {
            setMsg("Không xác định được Company ID hoặc Role ID");
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            const pRes = await fetch(new URL(`/api/permissions?scope=company`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!pRes.ok) {
                setMsg(`Lỗi tải permissions: ${pRes.status} ${await pRes.text()}`);
                setLoading(false);
                return;
            }
            const ps: Permission[] = await pRes.json();
            setPermissions(Array.isArray(ps) ? ps : []);

            try {
                const sRes = await fetch(new URL(`/api/roles/${roleId}/permissions`, base).toString(), {
                    headers: getAuthHeaders(),
                });
                if (sRes.ok) {
                    const ids: number[] = await sRes.json();
                    setSelected(new Set(ids || []));
                } else {
                    setSelected(new Set());
                }
            } catch {
                setSelected(new Set());
            }
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
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, companyId, roleId]);

    const toggle = (pid: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid); else next.add(pid);
            return next;
        });
    };

    async function save() {
        if (!companyId || !roleId) return;
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(
                new URL(`/api/companies/${companyId}/roles/${roleId}/permissions`, base).toString(),
                {
                    method: "PUT",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ permissionIds: Array.from(selected) }),
                }
            );
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Lưu thất bại: ${res.status} ${t}`);
                return;
            }
            setMsg("Đã lưu");
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
                <button className="btn btn-primary" onClick={() => auth.signinRedirect?.()}>Đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* Row: Title + Back + Save */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Edit Role Permissions</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}/roles`} className="btn btn-secondary">Back</Link>
                            <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
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

                {/* Row: Role ID */}
                <div className="row mt-3">
                    <div className="col-12 col-lg-8 col-xl-6">
                        <div className="table-responsive">
                            <table className="table table-bordered align-middle">
                                <thead>
                                <tr>
                                    <th style={{width:160}}>Role ID</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td className="font-monospace">{roleId || "—"}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Row: Permissions (code + checkbox) */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th style={{width:280}}>Permission Code</th>
                                    <th>Tick</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading && <tr><td colSpan={2} className="text-center py-5">Loading...</td></tr>}
                                {!loading && permissions.length === 0 && (
                                    <tr><td colSpan={2} className="text-center text-muted py-5">No permissions</td></tr>
                                )}
                                {!loading && permissions.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="fw-semibold">{p.code}</div>
                                            {p.name && <div className="text-muted small">{p.name}</div>}
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selected.has(p.id)}
                                                onChange={() => toggle(p.id)}
                                            />
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
