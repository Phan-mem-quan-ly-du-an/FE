import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyRoles, deleteRole, createCompanyRole, updateCompanyRole, Role } from "../../../apiCaller/companyRoles";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import CreateRoleModal from "./CreateRoleModal";
import EditRoleModal from "./EditRoleModal";
import ConfirmDeleteRoleModal from "./ConfirmDeleteRoleModal";
import { useAuth } from "react-oidc-context"; // Thêm import useAuth
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";


export default function CompaniesRolePage() {
    const auth = useAuth();
    const { t } = useTranslation();
    const { companyId } = useParams<{ companyId: string }>();
    const queryClient = useQueryClient();
    const navigate = useNavigate(); // Khởi tạo navigate

    const resolvedCompanyId = companyId || "";

    const [msg, setMsg] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

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
        setConfirmDelete(r); // Mở modal xác nhận thay vì confirm trực tiếp
    }

    // Hàm xử lý khi double-click vào một dòng role
    const handleRowDoubleClick = (roleData: Role) => {
        const roleId = roleData.id;
        if (roleId && resolvedCompanyId) {
            // Chuyển hướng đến trang permission của role đó
            navigate(`/companies/${resolvedCompanyId}/roles/${roleId}/permission`);
        } else {
            console.error("Cannot navigate: Role ID or Company ID is missing.");
        }
    };


    // Hàm để bật/tắt dropdown
    const toggleDropdown = (roleId: number) => {
        if (openDropdownId === roleId) {
            setOpenDropdownId(null); // Đóng lại nếu đang mở
        } else {
            setOpenDropdownId(roleId); // Mở cái mới
        }
    };
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
            header: 'Name',
            accessorKey: 'name',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const role: Role = row.original;
                return (
                    // Bọc nội dung cell bằng một div và thêm onDoubleClick
                    <div
                        onDoubleClick={() => handleRowDoubleClick(role)}
                        style={{ cursor: 'pointer', width: '100%', height: '100%' }}
                        title={t('DoubleClickToViewPermissions') || ""}
                    >
                        <div className="fw-semibold">{role.name || '—'}</div>
                        {role.code && <div className="text-muted small">{role.code}</div>}
                    </div>
                );
            },
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
        // --- THAY THẾ BẰNG ĐOẠN NÀY ---
        <Dropdown 
          isOpen={openDropdownId === r.id} 
          toggle={() => toggleDropdown(r.id)}
        >
          <DropdownToggle 
            tag="button" 
            className="btn btn-ghost-secondary btn-icon btn-sm" 
            title={t('MoreOptions') as string}
          >
            {/* Đây là icon "ba chấm dọc" */}
            <i className="ri-more-2-fill fs-16"></i> 
          </DropdownToggle>

          <DropdownMenu>
            {/* Nút Edit */}
            <DropdownItem onClick={() => { setEditingRole(r); setShowEdit(true); }}>
              <i className="ri-edit-2-line me-2"></i> {t('Edit')}
            </DropdownItem>
            
            {/* Nút Permission (vẫn dùng Link) */}
            <DropdownItem 
              tag={Link} 
              to={`/companies/${resolvedCompanyId}/roles/${r.id}/permission`}
              state={{ roleName: r.name, roleCode: r.code }}
            >
              <i className="ri-shield-user-line me-2"></i> {t('Permission')}
            </DropdownItem>

            {/* Thêm một đường gạch ngang để phân tách */}
            <DropdownItem divider /> 

            {/* Nút Delete */}
            <DropdownItem 
              onClick={() => handleDeleteRole(r)} 
              disabled={isDeleting} 
              className="text-danger"
            >
              <i className="ri-delete-bin-5-line me-2"></i> {t('Delete')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
        // --- KẾT THÚC PHẦN THAY THẾ ---
      );
    },
  },
     ], [t, resolvedCompanyId, deleteRoleMutation.isPending, openDropdownId, handleRowDoubleClick, navigate]);

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
                    onClose={() => { setShowEdit(false); setEditingRole(null); }} // Reset editingRole khi đóng
                    isSubmitting={editing}
                    initial={editingRole ?
                        { code: editingRole.code || "", name: editingRole.name || "", description: editingRole.description || "" } :
                        { code: "" }
                    }
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