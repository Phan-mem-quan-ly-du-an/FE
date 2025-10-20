import { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyRoles, deleteRole, createCompanyRole, updateCompanyRole, Role } from "../../../apiCaller/companyRoles";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import CreateRoleModal from "./CreateRoleModal";
import EditRoleModal from "./EditRoleModal";
import ConfirmDeleteRoleModal from "./ConfirmDeleteRoleModal";

export default function CompaniesRolePage() {
    const auth = useAuth();
    const { t } = useTranslation();
    const { companyId } = useParams<{ companyId: string }>();
    const queryClient = useQueryClient();

    const resolvedCompanyId = companyId || "";

    const [msg, setMsg] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);

    // removed getAuthHeaders; requests rely on global client/interceptors

    const rolesQuery = useQuery<Role[]>({
        queryKey: ["companyRoles", resolvedCompanyId, { includeGlobal: true }],
        enabled: !!resolvedCompanyId && !auth.isLoading && !!auth.user?.access_token,
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
        mutationFn: async (roleId: number) => deleteRole(resolvedCompanyId, roleId),
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
            header: '#',
            id: 'serial',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const pagination = row?.table?.getState?.().pagination;
                const pageIndex = pagination?.pageIndex ?? 0;
                const pageSize = pagination?.pageSize ?? 10;
                const serial = pageIndex * pageSize + row.index + 1;
                return <span className="text-muted">{serial}</span>;
            },
        },
        {
            header: 'Role ID',
            accessorKey: 'id',
            enableColumnFilter: false,
            cell: (info: any) => <span className="font-monospace">{info.getValue()}</span>,
        },
        {
            header: 'Name',
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
            header: 'Description',
            accessorKey: 'description',
            enableColumnFilter: false,
            cell: ({ getValue }: any) => getValue() || '—',
        },
        {
            header: 'Action',
            id: 'action',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const r: Role = row.original;
                const isDeleting = deleteRoleMutation.isPending;
                return (
                    <ul className="list-inline hstack gap-2 mb-0">
                        <li className="list-inline-item">
                            <button
                                className="btn btn-ghost-secondary btn-icon btn-sm"
                                title={t('Edit') as string}
                                onClick={() => { setEditingRole(r); setShowEdit(true); }}
                            >
                                <i className="ri-edit-2-line fs-16"></i>
                            </button>
                        </li>
                        <li className="list-inline-item">
                            <Link
                                to={`/companies/${resolvedCompanyId}/roles/${r.id}/permission`}
                                state={{ roleName: r.name, roleCode: r.code }}
                                className="btn btn-ghost-primary btn-icon btn-sm"
                                title={t('Permission') as string}
                            >
                                <i className="ri-shield-user-line fs-16"></i>
                            </Link>
                        </li>
                        <li className="list-inline-item">
                            <button
                                className="btn btn-ghost-danger btn-icon btn-sm"
                                title={t('Delete') as string}
                                onClick={() => handleDeleteRole(r)}
                                disabled={isDeleting}
                            >
                                <i className="ri-delete-bin-5-line fs-16"></i>
                            </button>
                        </li>
                    </ul>
                );
            },
        },
    ], [t, resolvedCompanyId, deleteRoleMutation.isPending]);

    const data = (rolesQuery.data ?? []) as Role[];

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
                                <div className="d-sm-flex align-items-center justify-content-between gap-2">
                                    <h5 className="card-title mb-0">{t('CompanyRoles')}</h5>
                                    <div className="d-flex flex-wrap gap-2 justify-content-sm-end">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => setShowCreate(true)}
                                        >
                                            <i className="ri-add-line me-1"></i>{t('CreateRole')}
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                {rolesQuery.isLoading ? (
                                    <div className="text-center py-5">{t('Loading')}</div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={data}
                                        isGlobalFilter={true}
                                        hidePagination={false}
                                        customPageSize={10}
                                        divClass="table-responsive table-card mb-1 mt-0"
                                        tableClass="align-middle table-nowrap"
                                        theadClass="table-light text-muted text-uppercase"
                                        SearchPlaceholder={t('SearchRolesPlaceholder')}
                                    />
                                )}
                                {!rolesQuery.isLoading && data.length === 0 && (
                                    <div className="text-center text-muted py-5">{t('NoRoles')}</div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <CreateRoleModal
                    show={showCreate}
                    onClose={() => setShowCreate(false)}
                    isSubmitting={creating}
                    onSubmit={async (values) => {
                        if (!resolvedCompanyId) return;
                        setCreating(true);
                        setMsg(null);
                        try {
                            await createCompanyRole(resolvedCompanyId, values);
                            setShowCreate(false);
                            await queryClient.invalidateQueries({ queryKey: ["companyRoles", resolvedCompanyId, { includeGlobal: true }] });
                        } catch (e: any) {
                            setMsg(e?.message || t('ErrorSaving'));
                        } finally {
                            setCreating(false);
                        }
                    }}
                />
                <EditRoleModal
                    show={showEdit}
                    onClose={() => setShowEdit(false)}
                    isSubmitting={editing}
                    initial={{ code: editingRole?.code || "", name: editingRole?.name || "", description: editingRole?.description || "" }}
                    onSubmit={async (values) => {
                        if (!resolvedCompanyId || !editingRole) return;
                        setEditing(true);
                        setMsg(null);
                        try {
                            await updateCompanyRole(resolvedCompanyId, editingRole.id, values);
                            setShowEdit(false);
                            setEditingRole(null);
                            await queryClient.invalidateQueries({ queryKey: ["companyRoles", resolvedCompanyId, { includeGlobal: true }] });
                        } catch (e: any) {
                            setMsg(e?.message || t('ErrorSaving'));
                        } finally {
                            setEditing(false);
                        }
                    }}
                />
                <ConfirmDeleteRoleModal
                    show={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    roleName={confirmDelete ? (confirmDelete.code || confirmDelete.name || String(confirmDelete.id)) : ''}
                    isDeleting={deleteRoleMutation.isPending}
                    onConfirm={async () => {
                        if (!confirmDelete) return;
                        try {
                            setMsg(null);
                            await deleteRoleMutation.mutateAsync(confirmDelete.id);
                            setConfirmDelete(null);
                        } catch (e: any) {
                            setMsg(e?.message || t('ErrorDeletingRole'));
                        }
                    }}
                />
            </Container>
        </div>
    );
}
