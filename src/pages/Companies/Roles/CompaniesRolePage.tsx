import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyRoles, deleteRole, Role } from "../../../apiCaller/companyRoles";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";

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
    const columns = useMemo(() => [
        {
            header: 'Id',
            accessorKey: 'id',
            enableColumnFilter: false,
            cell: (info: any) => <span className="font-monospace">{info.getValue()}</span>,
        },
        {
            header: 'Tên',
            accessorKey: 'name',
            enableColumnFilter: false,
            cell: ({ row }: any) => (
                <div>
                    <div className="fw-semibold">{row.original.name || '—'}</div>
                    {row.original.code && <div className="text-muted small">{row.original.code}</div>}
                </div>
            ),
        },
        {
            header: 'Mô tả',
            accessorKey: 'description',
            enableColumnFilter: false,
            cell: ({ getValue }: any) => getValue() || '—',
        },
        {
            header: '',
            id: 'action',
            enableColumnFilter: false,
            cell: ({ row }: any) => (
                <div className="d-flex align-items-center gap-2 p-2">
                    <Link className="btn btn-outline-primary" to={`/companies/${resolvedCompanyId}/roles/${row.original.id}/edit`}>{t('Edit')}</Link>
                    <button className="btn btn-outline-danger" onClick={() => handleDeleteRole(row.original)} disabled={deleteRoleMutation.isPending}>{t('Delete')}</button>
                    <Link className="btn btn-outline-primary" to={`/companies/${resolvedCompanyId}/roles/${row.original.id}/permission`}>{t('Permission')}</Link>
                </div>
            ),
        },
    ], [t, resolvedCompanyId, deleteRoleMutation.isPending]);

    const data = (rolesQuery.data ?? []) as Role[];

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
            <Container fluid>
                <BreadCrumb title={t('CompanyRoles')} pageTitle={t('CompanyRoles')} />

                {msg && (
                    <Row className="mb-3">
                        <Col>
                            <div className="alert alert-info mb-0">{msg}</div>
                        </Col>
                    </Row>
                )}

                <Row>
                    <Col>
                        <Card>
                            <CardHeader className="card-header border-0">
                                <Row className="align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">{t('CompanyRoles')}</h5>
                                    </div>
                                    <div className="col-sm-auto">
                                        <div className="d-flex gap-1 flex-wrap">
                                            <Link to={`/companies/${resolvedCompanyId}/roles/new`} className="btn btn-success">+ {t('CreateRole')}</Link>
                                        </div>
                                    </div>
                                </Row>
                            </CardHeader>
                            <CardBody className="pt-0">
                                {rolesQuery.isLoading ? (
                                    <div className="text-center py-5">{t('Loading')}</div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={data}
                                        isGlobalFilter={false}
                                        hidePagination={true}
                                        customPageSize={10}
                                        tableClass="table align-middle table-nowrap"
                                        theadClass="table-light"
                                    />
                                )}
                                {!rolesQuery.isLoading && data.length === 0 && (
                                    <div className="text-center text-muted py-5">{t('NoRoles')}</div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
