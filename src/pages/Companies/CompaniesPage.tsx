import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router-dom";

type Company = { id: string; name: string; logoUrl?: string };
type PageResp<T> = { content: T[]; totalPages: number; totalElements: number; number: number; size: number };

export default function CompaniesPage() {
    const auth = useAuth();
    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [q, setQ] = useState("");
    const [rows, setRows] = useState<Company[]>([]);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    const toImageUrl = (u?: string | null) => (u ? (u.startsWith("http") ? u : base + u) : "");

    async function loadList(currentPage = page) {
        setLoading(true);
        setMsg(null);
        try {
            const url = new URL("/api/companies", base);
            if (q.trim()) url.searchParams.set("q", q.trim());
            url.searchParams.set("page", String(currentPage));
            url.searchParams.set("size", String(size));
            const res = await fetch(url.toString(), { headers: getAuthHeaders() });
            if (!res.ok) { setMsg(`Lỗi tải: ${res.status} ${await res.text()}`); return; }
            const data: PageResp<Company> = await res.json();
            setRows(data.content ?? []);
            setTotalPages(data.totalPages ?? 0);
        } catch (e: any) {
            setMsg(`Lỗi: ${e.message}`);
        } finally { setLoading(false); }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        loadList(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(0);
        await loadList(0);
    }

    async function handleDelete(id: string) {
        if (!id) return;
        if (!window.confirm("Xoá công ty này?")) return;
        try {
            setLoading(true);
            const url = new URL(`/api/companies/${id}`, base).toString();
            const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
            if (!res.ok) {
                setMsg(`Xoá thất bại: ${res.status} ${await res.text()}`);
                return;
            }
            const isLastItemOnPage = rows.length === 1 && page > 0;
            const nextPage = isLastItemOnPage ? page - 1 : page;
            setPage(nextPage);
            await loadList(nextPage);
        } catch (e: any) {
            setMsg(e.message || "Lỗi xoá");
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

                {/* Row: Title */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Companies</h4>
                    </div>
                </div>
                <div className="page-title-box d-sm-flex align-items-center justify-content-between"></div>

                {/* Row: Toolbar (search + create) */}
                <div className="row g-2 align-items-end mb-2">
                    <div className="col-12">
                        <form className="row g-2" onSubmit={handleSearch}>
                            <div className="col">
                                <input
                                    className="form-control"
                                    placeholder="Tìm theo tên công ty..."
                                    value={q}
                                    onChange={(e)=>setQ(e.target.value)}
                                />
                            </div>
                            <div className="col-auto">
                                <button className="btn btn-primary" type="submit" disabled={loading}>Search</button>
                            </div>
                            <div className="col-auto">
                                <Link className="btn btn-success" to="/companies/new">+ Create Company</Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Row: Message */}
                {msg && (
                    <div className="row">
                        <div className="col-12">
                            <div className="alert alert-info mt-1 mb-0">{msg}</div>
                        </div>
                    </div>
                )}

                {/* Row: Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="table-responsive mt-3">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên công ty</th>
                                    <th>Logo</th>
                                    <th style={{width:220}}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map(c => {
                                    const imgSrc = toImageUrl(c.logoUrl);
                                    return (
                                        <tr key={c.id}>
                                            <td style={{fontFamily:"monospace"}}>{c.id}</td>
                                            <td>{c.name}</td>
                                            <td>{imgSrc ? <img src={imgSrc} alt="" style={{height:24}}/> : "-"}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <Link className="btn btn-sm btn-outline-primary" to={`/companies/${c.id}/edit`}>Edit</Link>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(c.id)} disabled={loading}>Delete</button>
                                                    <Link className="btn btn-sm btn-outline-secondary" to={`/companies/${c.id}`}>Members</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && rows.length === 0 && (
                                    <tr><td colSpan={4} className="text-center text-muted">No data</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Row: Pagination */}
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={page<=0 || loading}
                                onClick={()=>{ const p = Math.max(0, page-1); setPage(p); loadList(p); }}
                            >
                                ‹ Prev
                            </button>
                            <span className="align-self-center small">Page {page+1}/{Math.max(totalPages,1)}</span>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={page+1>=totalPages || loading}
                                onClick={()=>{ const p = page+1; setPage(p); loadList(p); }}
                            >
                                Next ›
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
