import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, Button, Spinner, Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Alert } from 'reactstrap';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getWorkspaceRoles, WorkspaceRole, deleteWorkspaceRole, createWorkspaceRole, updateWorkspaceRole } from '../../apiCaller/workspaceRoles';
import CreateRoleModal from '../Companies/Roles/CreateRoleModal';
import EditRoleModal from '../Companies/Roles/EditRoleModal';
import { isForbiddenError } from '../../helpers/permissions';

const RoleTab: React.FC = () => {
    const { t } = useTranslation();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingRole, setEditingRole] = useState<WorkspaceRole | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const {
        data: roles = [],
        isLoading,
        error,
    } = useQuery<WorkspaceRole[]>({
        queryKey: ['workspace-roles', workspaceId],
        queryFn: () => getWorkspaceRoles(workspaceId!),
        enabled: !!workspaceId,
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async (roleId: number) => {
            if (!workspaceId) throw new Error('No workspace ID');
            await deleteWorkspaceRole(workspaceId, roleId);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['workspace-roles', workspaceId] });
            toast.success(t('RoleDeletedSuccessfully') || 'Xóa role thành công');
            setDeleteError(null);
        },
        onError: (error: any) => {
            if (isForbiddenError(error)) {
                const errorMsg = t('WorkspacePermissions.DeleteRoleDenied');
                setDeleteError(errorMsg);
                toast.warning(errorMsg, {
                    position: 'top-right',
                    autoClose: 5000,
                    style: { zIndex: 99999 }
                });
                return;
            }
            const errorMsg = error?.message || t('FailedDeleteRole') || 'Xóa role thất bại';
            setDeleteError(errorMsg);
            toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
                style: { zIndex: 99999 }
            });
        },
    });

    const toggleDropdown = (roleId: number) => {
        if (openDropdownId === roleId) {
            setOpenDropdownId(null);
        } else {
            setOpenDropdownId(roleId);
        }
    };

    const handleEdit = (role: WorkspaceRole) => {
        setEditingRole(role);
        setShowEdit(true);
    };

    const handleDelete = (role: WorkspaceRole) => {
        if (globalThis.confirm(t('ConfirmDeleteRole'))) {
            deleteRoleMutation.mutate(role.id);
        }
    };

    const columns = useMemo(() => [
        {
            header: t('SerialNumber'),
            id: 'serial',
            enableColumnFilter: false,
            cell: ({ row }: any) => (
                <span className="text-muted">{row.index + 1}</span>
            ),
        },
        {
            header: t('RoleName'),
            accessorKey: 'name',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const role: WorkspaceRole = row.original;
                return (
                    <div>
                        <div className="fw-semibold">{role.name || '—'}</div>
                        {role.code && <div className="text-muted small">{role.code}</div>}
                    </div>
                );
            },
        },
        {
            header: t('RoleDescription'),
            accessorKey: 'description',
            enableColumnFilter: false,
            cell: ({ getValue }: any) => getValue() || '—',
        },
        {
            header: t('Action'),
            id: 'action',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const role: WorkspaceRole = row.original;
                return (
                    <Dropdown
                        isOpen={openDropdownId === role.id}
                        toggle={() => toggleDropdown(role.id)}
                    >
                        <DropdownToggle
                            tag="button"
                            className="btn btn-ghost-secondary btn-icon btn-sm"
                            title={t('More')}
                        >
                            <i className="ri-more-2-fill fs-16" />
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem onClick={() => handleEdit(role)}>
                                <i className="ri-edit-2-line me-2" /> {t('Edit')}
                            </DropdownItem>
                            <DropdownItem onClick={() => {
                                if (workspaceId) {
                                    navigate(`/workspaces/${workspaceId}/roles/${role.id}/permissions`, {
                                        state: {
                                            roleName: role.name,
                                            roleCode: role.code,
                                            backTo: `/workspaces/${workspaceId}?tab=4`
                                        }
                                    });
                                }
                            }}>
                                <i className="ri-shield-user-line me-2" /> {t('RolePermissions')}
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                <i className="ri-delete-bin-5-line me-2" /> {t('Delete')}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            },
        },
    ], [workspaceId, navigate, openDropdownId, t]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ blockSize: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingRoles')}</span>
            </div>
        );
    }

    if (error) {
        const forbidden = isForbiddenError(error);
        return (
            <div className={`alert ${forbidden ? 'alert-warning' : 'alert-danger'} text-center`}>
                <i className="ri-error-warning-line me-2"></i>
                {forbidden 
                    ? (t('WorkspacePermissions.ViewRolesDenied') || 'Bạn không có quyền xem danh sách role của workspace.') 
                    : t('FailedToLoadRoles')}
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            {deleteError && (
                <Alert color="warning" className="mb-3">
                    <strong>⚠️ {t('Error')}:</strong> {deleteError}
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('WorkspaceRoles')}</h5>
                        <div>
                            <Button color="success" size="sm" className="me-2" onClick={() => setShowCreate(true)}>
                                <i className="ri-add-line me-1" /> {t('CreateRole')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {roles.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="ri-shield-line fs-1 text-muted" />
                            <p className="text-muted mt-2">{t('NoRolesInWorkspace')}</p>
                        </div>
                    ) : (
                        <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                            <tr>
                                {columns.map(column => (
                                    <th key={column.header}>{column.header}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {roles.map((role, index) => (
                                <tr key={role.id}>
                                    <td className="text-muted">{index + 1}</td>
                                    <td>
                                        <div className="fw-semibold">{role.name || '—'}</div>
                                        {role.code && <div className="text-muted small">{role.code}</div>}
                                    </td>
                                    <td className="text-muted">{role.description || '—'}</td>
                                    <td>
                                        <Dropdown
                                            isOpen={openDropdownId === role.id}
                                            toggle={() => toggleDropdown(role.id)}
                                        >
                                            <DropdownToggle
                                                tag="button"
                                                className="btn btn-ghost-secondary btn-icon btn-sm"
                                            >
                                                <i className="ri-more-2-fill fs-16" />
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem onClick={() => handleEdit(role)}>
                                                    <i className="ri-edit-2-line me-2" /> {t('Edit')}
                                                </DropdownItem>
                                                <DropdownItem onClick={() => {
                                                    if (workspaceId) {
                                                        navigate(`/workspaces/${workspaceId}/roles/${role.id}/permissions`, {
                                                            state: {
                                                                roleName: role.name,
                                                                roleCode: role.code,
                                                                backTo: `/workspaces/${workspaceId}?tab=4`
                                                            }
                                                        });
                                                    }
                                                }}>
                                                    <i className="ri-shield-user-line me-2" /> {t('RolePermissions')}
                                                </DropdownItem>
                                                <DropdownItem divider />
                                                <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                                    <i className="ri-delete-bin-5-line me-2" /> {t('Delete')}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Create Role Modal */}
            {workspaceId && (
                <>
                    <CreateRoleModal
                        show={showCreate}
                        error={createError}
                        onClose={() => {
                            setShowCreate(false);
                            setCreateError(null);
                        }}
                        onSubmit={async (values) => {
                            if (!workspaceId) return;
                            setCreateError(null);
                            try {
                                await createWorkspaceRole(workspaceId, values);
                                setShowCreate(false);
                                setCreateError(null);
                                await queryClient.invalidateQueries({ queryKey: ['workspace-roles', workspaceId] });
                                toast.success(t('Saved') || 'Đã lưu');
                            } catch (error: any) {
                                if (isForbiddenError(error)) {
                                    const errorMsg = t('WorkspacePermissions.CreateRoleDenied');
                                    setCreateError(errorMsg);
                                    toast.warning(errorMsg, {
                                        position: 'top-right',
                                        autoClose: 5000,
                                        style: { zIndex: 99999 }
                                    });
                                } else {
                                    const errorMsg = error?.message || t('ErrorCreatingRole');
                                    setCreateError(errorMsg);
                                    toast.error(errorMsg, {
                                        position: 'top-right',
                                        autoClose: 5000,
                                        style: { zIndex: 99999 }
                                    });
                                }
                            }
                        }}
                    />
                    <EditRoleModal
                        show={showEdit}
                        error={editError}
                        onClose={() => {
                            setShowEdit(false);
                            setEditingRole(null);
                            setEditError(null);
                        }}
                        initial={editingRole ? {
                            code: editingRole.code || "",
                            name: editingRole.name || "",
                            description: editingRole.description || ""
                        } : { code: "" }}
                        onSubmit={async (values) => {
                            if (!workspaceId || !editingRole) return;
                            setEditError(null);
                            try {
                                await updateWorkspaceRole(workspaceId, editingRole.id, values);
                                setShowEdit(false);
                                setEditingRole(null);
                                setEditError(null);
                                await queryClient.invalidateQueries({ queryKey: ['workspace-roles', workspaceId] });
                                toast.success(t('Saved') || 'Đã lưu');
                            } catch (error: any) {
                                if (isForbiddenError(error)) {
                                    const errorMsg = t('WorkspacePermissions.UpdateRoleDenied');
                                    setEditError(errorMsg);
                                    toast.warning(errorMsg, {
                                        position: 'top-right',
                                        autoClose: 5000,
                                        style: { zIndex: 99999 }
                                    });
                                } else {
                                    const errorMsg = error?.message || t('ErrorUpdatingRole');
                                    setEditError(errorMsg);
                                    toast.error(errorMsg, {
                                        position: 'top-right',
                                        autoClose: 5000,
                                        style: { zIndex: 99999 }
                                    });
                                }
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default RoleTab;