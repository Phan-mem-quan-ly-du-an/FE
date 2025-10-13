import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyRoles, deleteRole, Role } from "../../../apiCaller/companyRoles";

// Use Role type from apiCaller

export default function CompaniesRolePage() {
    const auth = useAuth();
    const { t } = useTranslation();
    const { companyId } = useParams<{ companyId: string }>();
    const queryClient = useQueryClient();

    const resolvedCompanyId = companyId || "";

    const [msg, setMsg] = useState<string | null>(null);

    // removed getAuthHeaders; requests rely on global client/interceptors

    const rolesQuery = useQuery<Role[]>({
        queryKey: ["companyRoles", resolvedCompanyId, { includeGlobal: true }],
        enabled: !!resolvedCompanyId && !auth.isLoading && !!auth.user?.id_token,
        queryFn: async () => {
            if (!resolvedCompanyId) {
                setMsg(t("CannotDetermineCompanyId"));
                return [];
            }
            setMsg(null);
            return await getCompanyRoles(resolvedCompanyId, true);
        },
        staleTime: 30_000,
    });

    useEffect(() => {
        if (rolesQuery.isError) {
            const anyErr: any = rolesQuery.error as any;
            const text = anyErr?.response?.data?.error || anyErr?.message || "";
            setMsg(t("LoadRolesError", { status: anyErr?.response?.status || "", text }));
        }
    }, [rolesQuery.isError, rolesQuery.error, t]);

    const deleteRoleMutation = useMutation({
        mutationFn: async (roleId: number) => deleteRole(roleId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["companyRoles", resolvedCompanyId, { includeGlobal: true }] });
        },
        onError: async (error: any) => {
            setMsg(t("DeleteFailed", { status: "", text: error?.message || "" }));
        },
    });

    async function handleDeleteRole(r: Role) {
        if (!r?.id) return;
        if (!window.confirm(t("DeleteRoleConfirm", { name: r.code || r.name || r.id }))) return;
        try {
            setMsg(null);
            await deleteRoleMutation.mutateAsync(r.id);
        } catch (e: any) {
            setMsg(e?.message || t("ErrorDeletingRole"));
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
                {rolesQuery.isLoading && <tr><td colSpan={4} className="text-center py-5">{t("Loading")}</td></tr>}
                {!rolesQuery.isLoading && ((rolesQuery.data ?? []) as Role[]).length === 0 && (
                                    <tr><td colSpan={4} className="text-center text-muted py-5">{t("NoRoles")}</td></tr>
                                )}
                {!rolesQuery.isLoading && ((rolesQuery.data ?? []) as Role[]).map((r: Role) => (
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
                                                <button className="btn btn-outline-danger" onClick={() => handleDeleteRole(r)} disabled={deleteRoleMutation.isPending}>{t("Delete")}</button>
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
