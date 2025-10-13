import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Role = {
    id: number;
    code: string;
    name?: string | null;
    description?: string | null;
};

export default function CompaniesRolePage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { companyId } = useParams<{ companyId: string }>();

    const resolvedCompanyId = companyId || "";

    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const idToken = auth.user?.id_token;
        return { ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadRoles() {
        if (!resolvedCompanyId) { setMsg(t("CannotDetermineCompanyId")); return; }
        setLoading(true); setMsg(null);
        try {
            const url = new URL(`/api/companies/${resolvedCompanyId}/roles`, base);
            url.searchParams.set("includeGlobal", "true");
            const res = await fetch(url.toString(), { headers: getAuthHeaders() });
            if (!res.ok) { setMsg(t("LoadRolesError", { status: res.status, text: await res.text() })); return; }

            const json = await res.json();
            const list: Role[] = Array.isArray(json) ? json : (json?.roles || []);
            setRoles(Array.isArray(list) ? list : []);
        } catch (e: any) {
            setMsg(e?.message || t("ErrorLoadingRoles"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.id_token) return;
        loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.id_token, companyId]);

    async function handleDeleteRole(r: Role) {
        if (!r?.id) return;
        if (!window.confirm(t("DeleteRoleConfirm", { name: r.code || r.name || r.id }))) return;
        try {
            setLoading(true);
            const res = await fetch(new URL(`/api/roles/${r.id}`, base).toString(), {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                setMsg(t("DeleteFailed", { status: res.status, text: await res.text() }));
                return;
            }
            await loadRoles();
        } catch (e: any) {
            setMsg(e?.message || t("ErrorDeletingRole"));
        } finally {
            setLoading(false);
        }
    }


    if (auth.isLoading) return <div className="container">{t("CheckingSession")}</div>;
    if (!auth.isAuthenticated || !auth.user?.id_token) {
        return (
            <div className="container">
                <p>{t("NotLoggedIn")}</p>
                <button className="btn btn-primary" onClick={() => auth.signinRedirect?.()}>{t("Login")}</button>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* Row: Title + Actions */}
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">{t("CompanyRoles")}</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${resolvedCompanyId}/members`} className="btn btn-secondary">{t("Back")}</Link>
                            <Link to={`/companies/${resolvedCompanyId}/roles/new`} className="btn btn-success">+ {t("CreateRole")}</Link>
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

                {/* Row: Table (role_id | code(role_name) | description | action) */}
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th style={{width:140}}>Role ID</th>
                                    <th>Role name (Code)</th>
                                    <th>Description</th>
                                    <th style={{width:180}}>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading && <tr><td colSpan={4} className="text-center py-5">{t("Loading")}</td></tr>}
                                {!loading && roles.length === 0 && (
                                    <tr><td colSpan={4} className="text-center text-muted py-5">{t("NoRoles")}</td></tr>
                                )}
                                {!loading && roles.map(r => (
                                    <tr key={r.id}>
                                        <td className="font-monospace">{r.id}</td>
                                        <td>
                                            <div className="fw-semibold">{r.name || "—"}</div>
                                            {r.code && <div className="text-muted small">{r.code}</div>}
                                        </td>
                                        <td>{r.description || "—"}</td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <Link className="btn btn-outline-primary" to={`/companies/${resolvedCompanyId}/roles/${r.id}/edit`}>{t("Edit")}</Link>
                                                <button className="btn btn-outline-danger" onClick={() => handleDeleteRole(r)} disabled={loading}>{t("Delete")}</button>
                                                <Link className="btn btn-outline-primary" to={`/companies/${resolvedCompanyId}/roles/${r.id}/permission`}>{t("Permission")}</Link>
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
