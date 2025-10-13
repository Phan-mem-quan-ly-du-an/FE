import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams, useNavigate } from "react-router-dom";

type CreateRoleReq = {
    code: string;
    name?: string;
    description?: string | null;
};

type RoleResp = {
    id: number;
    code: string;
    name?: string;
    description?: string | null;
};

export default function CreateRolePage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const params = useParams();

    // Lấy companyId an toàn cho cả :companyId / :id
    const companyId = useMemo(
        () =>
            (params as any).companyId ||
            (params as any).id ||
            window.location.pathname.match(/\/companies\/([^/]+)/)?.[1] ||
            "",
        [params]
    );

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!auth.user?.id_token) { setMsg("Bạn chưa đăng nhập!"); return; }
        if (!companyId) { setMsg("Không xác định được Company ID"); return; }
        if (!code.trim()) { setMsg("Code là bắt buộc"); return; }

        setSubmitting(true);
        setMsg(null);
        try {
            const body: CreateRoleReq = {
                code: code.trim(),
                name: name.trim() || undefined,
                description: description.trim() || undefined,
            };
            const res = await fetch(new URL(`/api/companies/${companyId}/roles`, base).toString(), {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Tạo role thất bại: ${res.status} ${t}`);
                return;
            }
            const role: RoleResp = await res.json();

            navigate(`/companies/${companyId}/roles/`);
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
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

                {/* Row: Title + Back */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Create Role</h4>
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

                {/* Row: Form */}
                <div className="row mt-3">
                    <div className="col-12 col-lg-8 col-xl-6">
                        <form onSubmit={onSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Code <span className="text-danger">*</span></label>
                                <input
                                    className="form-control"
                                    value={code}
                                    onChange={(e)=>setCode(e.target.value)}
                                    placeholder="e.g. company:admin"
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
                                <button className="btn btn-primary" type="submit" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
