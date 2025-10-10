import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";
import { uploadImageTo } from "../../lib/uploader";

type Company = { id: string; name: string; logoUrl?: string };

export default function EditCompanyPage() {
    const auth = useAuth();
    const params = useParams();
    const companyId = useMemo(() => {
        return (
            (params as any).id ||
            (params as any).companyId ||
            window.location.pathname.match(/\/companies\/([^/]+)\/edit/)?.[1] ||
            ""
        );
    }, [params]);

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [name, setName] = useState("");
    const [logoAbs, setLogoAbs] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const toRelative = (u?: string) => (u ? (u.startsWith(base) ? u.replace(base, "") : u) : "");
    const toAbsolute = (u?: string) => (u ? (u.startsWith("http") ? u : base + u) : "");

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function load() {
        if (!companyId) {
            setMsg("Không xác định được Company ID từ URL.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(new URL(`/api/companies/${companyId}`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Lỗi tải dữ liệu: ${res.status} ${t}`);
                return;
            }
            const data: Company = await res.json();
            setName(data.name ?? "");
            setLogoAbs(toAbsolute(data.logoUrl));
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, companyId]);

    async function handleUpload(file: File) {
        const idToken = auth.user?.id_token;
        if (!idToken) { setMsg("Bạn chưa đăng nhập!"); return; }
        try {
            setUploading(true);
            const r = await uploadImageTo("company-logo", file, idToken, base);
            // preview absolute; DB sẽ nhận relative khi lưu
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
        if (!companyId) { setMsg("Không xác định được Company ID"); return; }
        if (!name.trim()) { setMsg("Tên công ty là bắt buộc"); return; }

        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(new URL(`/api/companies/${companyId}`, base).toString(), {
                method: "PUT",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    name: name.trim(),
                    // gửi DB: relative
                    logoUrl: toRelative(logoAbs) || undefined,
                }),
            });
            if (!res.ok) {
                const t = await res.text();
                setMsg(`Lưu thất bại: ${res.status} ${t}`);
                return;
            }
            const data: Company = await res.json();
            // đồng bộ preview theo response (DB trả relative)
            setLogoAbs(toAbsolute(data.logoUrl));
            setMsg("Đã lưu");
        } catch (e: any) {
            setMsg(e?.message || "Có lỗi xảy ra");
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

                {/* Row: Title */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Edit Company</h4>
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
                                <Link to="/companies" className="btn btn-secondary">Back</Link>
                                <button className="btn btn-primary" type="submit" disabled={saving}>
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
