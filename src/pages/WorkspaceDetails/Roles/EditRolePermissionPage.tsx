import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Permission interface
export type Permission = {
    id: number;
    scope: "company" | "workspace" | "project";
    code: string;
    name: string;
};

export default function EditWorkspaceRolePermissionPage() {
    const auth = useAuth();
    const { t } = useTranslation();
    const params = useParams();

    const workspaceId = useMemo(
        () => (params as any).workspaceId || (params as any).id || window.location.pathname.match(/\/workspaces\/([^/]+)/)?.[1] || "", [params]
    );
    const roleIdStr = useMemo(
        () => (params as any).roleId || (params as any).id2 || window.location.pathname.match(/\/roles\/([^/]+)$/)?.[1] || "", [params]
    );
    const roleId = Number(roleIdStr);
    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const loc = useLocation() as { state?: { roleName?: string; roleCode?: string; backTo?: string } };
    const initialRole = { name: loc.state?.roleName || "", code: loc.state?.roleCode || "" };
    const roleQuery = useQuery({
        queryKey: ["workspaceRole", workspaceId, roleId],
        enabled: !!workspaceId && !!roleId && !!auth.user?.access_token && (!initialRole.name || !initialRole.code),
        queryFn: async () => {
            const res = await fetch(new URL(`/api/workspaces/${workspaceId}/roles/${roleId}`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json() as Promise<{ id: string | number; name: string; code?: string }>;
        },
    });
    const roleName = initialRole.name || roleQuery.data?.name || "";
    const roleCode = initialRole.code || roleQuery.data?.code || "";
    const roleDisplay = roleCode ? `${roleName} (${roleCode})` : roleName;

    // Disable editing only for admin default role
    const isDefaultRole = roleCode?.toLowerCase() === "admin";

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const accessToken = auth.user?.access_token;
        return { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(extra ?? {}) };
    }

    async function loadAll() {
        if (!workspaceId || !roleId) {
            setMsg(t("CannotDetermineWorkspaceOrRoleId") || "Không xác định được workspace hoặc role");
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            const pRes = await fetch(new URL(`/api/permissions?scope=workspace`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!pRes.ok) {
                setMsg(t("LoadPermissionsError", { status: pRes.status, text: await pRes.text() }) || "");
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
            setMsg(e?.message || t("ErrorLoadingData") || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated || !auth.user?.access_token) return;
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isLoading, auth.isAuthenticated, auth.user?.access_token, workspaceId, roleId]);

    const toggle = (pid: number) => {
        if (isDefaultRole) return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid); else next.add(pid);
            return next;
        });
    };

    async function save() {
        if (isDefaultRole) return;
        if (!workspaceId || !roleId) return;
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(
                new URL(`/api/workspaces/${workspaceId}/roles/${roleId}/permissions`, base).toString(),
                {
                    method: "PUT",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ permissionIds: Array.from(selected) }),
                }
            );
            if (!res.ok) {
                const txt = await res.text();
                setMsg(t("SaveFailed", { status: res.status, text: txt }) || txt);
                return;
            }
            setMsg(t("Saved") || "Đã lưu");
        } catch (e: any) {
            setMsg(e?.message || t("ErrorSaving") || "Lỗi lưu thông tin");
        } finally {
            setSaving(false);
        }
    }

    if (auth.isLoading) return <div className="container">{t("CheckingSession")}</div>;
    if (!auth.isAuthenticated || !auth.user?.access_token) {
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
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header border-0">
                                <div className="row align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">
                                            {t("EditRolePermissions")}
                                            <span className="badge bg-light text-body ms-2">{roleDisplay}</span>
                                        </h5>
                                        {isDefaultRole && (
                                            <div className="text-danger small mt-1">
                                                {t("DefaultRoleCannotBeEdited") || "This is a default role and cannot be modified."}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-sm-auto">
                                        <div className="d-flex gap-2">
                                            <Link to={loc.state?.backTo || `/workspaces/${workspaceId}?tab=4`} className="btn btn-secondary">
                                                <i className="ri-arrow-go-back-line me-1"></i>{t("Back")}
                                            </Link>
                                            <button className="btn btn-primary" onClick={save} disabled={saving || loading || isDefaultRole}>
                                                <i className="ri-save-3-line me-1"></i>{saving ? t("Saving") : t("Save")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body pt-0">
                                {/* Messages */}
                                {msg && (
                                    <div className="row mb-3">
                                        <div className="col">
                                            <div className="alert alert-info mb-0">{msg}</div>
                                        </div>
                                    </div>
                                )}
                                {/* Row: Role ID | Role Name */}
                                <div className="row mt-3">
                                    <div className="col-12 col-lg-8 col-xl-6">
                                        <div className="table-responsive table-card mb-1 mt-0">
                                            <table className="table align-middle table-nowrap">
                                                <thead className="table-light text-muted text-uppercase">
                                                    <tr>
                                                        <th style={{ width: 160 }}>{t('RoleID')}</th>
                                                        <th>{t('RoleName')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="font-monospace">{roleId || "—"}</td>
                                                        <td>
                                                            {roleName ? (
                                                                <>
                                                                    <div className="fw-semibold">{roleName}</div>
                                                                    {roleCode && <div className="text-muted small">({roleCode})</div>}
                                                                </>
                                                            ) : "—"}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="table-responsive table-card mb-1 mt-0">
                                    <table className="table align-middle table-nowrap">
                                                <thead className="table-light text-muted text-uppercase">
                                                    <tr>
                                                        <th style={{ width: 320 }}>{t('PermissionName')}</th>
                                                        <th className="text-center" style={{ width: 140 }}>{t('Tick')}</th>
                                                    </tr>
                                                </thead>
                                        <tbody>
                                            {!loading && permissions.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="fw-semibold">{p.name}</div>
                                                        {p.code && <div className="text-muted small">{p.code}</div>}
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selected.has(p.id)}
                                                            onChange={() => toggle(p.id)}
                                                            disabled={isDefaultRole}
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
            </div>
        </div>
    );
}
