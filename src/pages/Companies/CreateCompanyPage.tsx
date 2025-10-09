import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate } from "react-router-dom";
import { uploadImageTo } from "../../lib/uploader";

export default function CreateCompanyPage() {
    const auth = useAuth();
    const navigate = useNavigate();

    const base = process.env.REACT_APP_API_URL as string;

    const [name, setName] = useState("");
    const [logoAbs, setLogoAbs] = useState<string>("");
    const [msg, setMsg] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const toRelative = (u?: string) => (u ? (u.startsWith(base) ? u.replace(base, "") : u) : "");
    const toAbsolute = (u?: string) => (u ? (u.startsWith("http") ? u : base + u) : "");

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function handleUpload(file: File) {
        const idToken = auth.user?.id_token;
        if (!idToken) { setMsg("Bạn chưa đăng nhập!"); return; }
        try {
            setUploading(true);
            const r = await uploadImageTo("company-logo", file, idToken, base);
            // r.url là relative → preview cần absolute
            setLogoAbs(toAbsolute(r.url));
            setMsg("Upload logo thành công!");
        } catch (e: any) {
            setMsg(e?.message || "Upload thất bại");
        } finally {
            setUploading(false);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        if (!auth.user?.id_token) { setMsg("Bạn chưa đăng nhập!"); return; }
        if (!name.trim()) { setMsg("Tên công ty là bắt buộc"); return; }

        setSubmitting(true);
        try {
            const res = await fetch(new URL("/api/companies", base).toString(), {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    name: name.trim(),
                    // gửi DB: relative
                    logoUrl: toRelative(logoAbs) || undefined,
                }),
            });
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Tạo thất bại: ${res.status} ${t}`);
                return;
            }
            const data = await res.json();
            navigate(`/companies/${data.id}/edit`);
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

                {/* Row: Title */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Create Company</h4>
                        <div className="text-end">
                            <Link to="/companies" className="btn btn-secondary">Back</Link>
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
                                <label className="form-label">Name</label>
                                <input
                                    className="form-control"
                                    value={name}
                                    onChange={(e)=>setName(e.target.value)}
                                    placeholder="Company name"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label d-block">Logo</label>
                                <input
                                    className="form-control"
                                    type="file"
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={(e)=>{ const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                                />
                                {logoAbs && (
                                    <div className="mt-2">
                                        <img src={logoAbs} alt="logo" style={{height:56}} />
                                    </div>
                                )}
                            </div>

                            <div className="d-flex gap-2">
                                <Link to="/companies" className="btn btn-secondary">Cancel</Link>
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
