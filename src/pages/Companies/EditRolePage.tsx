import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";

type Role = {
    id: number;
    code: string;
    name?: string | null;
    description?: string | null;
    scope?: "company" | "workspace" | "project";
    targetId?: string | null;
};

export default function EditRolePage() {
    const auth = useAuth();
    const params = useParams();

    // Lấy companyId & roleId an toàn (hỗ trợ nhiều tên param)
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
            window.location.pathname.match(/\/roles\/([^/]+)\/edit/)?.[1] ||
            "",
        [params]
    );
    const roleId = Number(roleIdStr);

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function load() {
        if (!companyId || !roleId) { setMsg("Thiếu Company ID hoặc Role ID"); setLoading(false); return; }
        setLoading(true); setMsg(null);
        try {
            // Lấy toàn bộ roles của company
            const listRes = await fetch(
                new URL(`/api/companies/${companyId}/roles?includeGlobal=true`, base).toString(),
                { headers: getAuthHeaders() }
            );
            if (!listRes.ok) { setMsg(`Lỗi tải roles: ${listRes.status} ${await listRes.text()}`); return; }
            const list: Role[] = await listRes.json();

            // Tìm role theo roleId
            const r = list.find(x => x.id === roleId);
            if (!r) {
                setMsg("Role không tồn tại trong công ty này");
                return;
            }
            setCode(r.code || "");
            setName(r.name || "");
            setDescription(r.description || "");
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi khi tải role");
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, roleId]);

    async function onSave(e?: React.FormEvent) {
        e?.preventDefault();
        if (!companyId || !roleId) { setMsg("Thiếu Company ID hoặc Role ID"); return; }
        if (!code.trim()) { setMsg("Code là bắt buộc"); return; }

        setSaving(true); setMsg(null);
        try {
            // PUT company-scoped (theo yêu cầu)
            const res = await fetch(
                new URL(`/api/companies/${companyId}/roles/${roleId}`, base).toString(),
                {
                    method: "PUT",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({
                        code: code.trim(),
                        name: name.trim() || undefined,
                        description: description.trim() || undefined,
                    }),
                }
            );
            if (!res.ok) { setMsg(`Lưu thất bại: ${res.status} ${await res.text()}`); return; }
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
    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* Row: Title + Actions */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Edit Role</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}/roles`} className="btn btn-secondary">Back</Link>
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

                {/* Row: Form (code, name, description) */}
                <div className="row mt-3">
                    <div className="col-12 col-lg-8 col-xl-6">
                        <form onSubmit={onSave}>
                            <div className="mb-3">
                                <label className="form-label">Code (Read Only)</label>
                                <input
                                    className="form-control"
                                    value={code}
                                    readOnly={true}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Role name</label>
                                <input
                                    className="form-control"
                                    value={name}
                                    onChange={(e)=>setName(e.target.value)}
                                    placeholder="e.g. Company Admin"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={description}
                                    onChange={(e)=>setDescription(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <Link to={`/companies/${companyId}/roles`} className="btn btn-secondary">Cancel</Link>
                                <button className="btn btn-primary" type="submit" disabled={saving || deleting}>
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
