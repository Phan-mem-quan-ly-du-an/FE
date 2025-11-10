import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button, Spinner, Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getProjectRoles, ProjectRole, deleteProjectRole, createProjectRole, updateProjectRole } from '../../apiCaller/projectRoles';
import CreateRoleModal from '../Companies/Roles/CreateRoleModal';
import EditRoleModal from '../Companies/Roles/EditRoleModal';
import { useTranslation } from 'react-i18next';

const RoleTab: React.FC = () => {
    const { t } = useTranslation();
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const {
        data: roles = [],
        isLoading,
        error,
    } = useQuery<ProjectRole[]>({
        queryKey: ['project-roles', projectId],
        queryFn: () => getProjectRoles(projectId!),
        enabled: !!projectId,
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async (roleId: number) => {
            if (!projectId) throw new Error('No project ID');
            await deleteProjectRole(projectId, roleId);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
        },
    });

    const toggleDropdown = (roleId: number) => {
        if (openDropdownId === roleId) {
            setOpenDropdownId(null);
        } else {
            setOpenDropdownId(roleId);
        }
    };

    const handleEdit = (role: ProjectRole) => {
        setEditingRole(role);
        setShowEdit(true);
    };

    const handleDelete = (role: ProjectRole) => {
        if (window.confirm(`${t('AreYouSureDeleteRole')} "${role.name || role.code}"?`)) {
            deleteRoleMutation.mutate(role.id);
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            id: 'serial',
            enableColumnFilter: false,
            cell: ({ row }: any) => (
                <span className="text-muted">{row.index + 1}</span>
            ),
        },
        {
            header: t('Name'),
            accessorKey: 'name',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const role: ProjectRole = row.original;
                return (
                    <div>
                        <div className="fw-semibold">{role.name || '—'}</div>
                        {role.code && <div className="text-muted small">{role.code}</div>}
                    </div>
                );
            },
        },
        {
            header: t('Description'),
            accessorKey: 'description',
            enableColumnFilter: false,
            cell: ({ getValue }: any) => getValue() || '—',
        },
        {
            header: t('Action'),
            id: 'action',
            enableColumnFilter: false,
            cell: ({ row }: any) => {
                const role: ProjectRole = row.original;
                return (
                    <Dropdown 
                        isOpen={openDropdownId === role.id} 
                        toggle={() => toggleDropdown(role.id)}
                    >
                        <DropdownToggle 
                            tag="button" 
                            className="btn btn-ghost-secondary btn-icon btn-sm"
                            title={t('MoreOptions')}
                        >
                            <i className="ri-more-2-fill fs-16"></i>
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem onClick={() => handleEdit(role)}>
                                <i className="ri-edit-2-line me-2"></i> {t('Edit')}
                            </DropdownItem>
                            <DropdownItem
                                onClick={(companyId) => {
                                    if (projectId) {
                                        navigate(`/companies/${companyId}/projects/${projectId}/roles/${role.id}/permissions`, {
                                            state: {
                                                companyId,  // THÊM dòng này
                                                roleName: role.name,
                                                roleCode: role.code,
                                            },
                                        });
                                    }
                                }}
                            >
                                <i className="ri-shield-user-line me-2"></i> {t('Permissions')}
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                <i className="ri-delete-bin-5-line me-2"></i> {t('Delete')}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            },
        },
    ], [projectId, navigate, openDropdownId, t]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingRoles')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger text-center">
                <i className="ri-error-warning-line me-2"></i>
                {t('FailedToLoadRoles')}
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('ProjectRoles')}</h5>
                        <div>
                            <Button color="success" size="sm" className="me-2" onClick={() => setShowCreate(true)}>
                                <i className="ri-add-line me-1"></i> {t('CreateRole')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {roles.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="ri-shield-line fs-1 text-muted"></i>
                            <p className="text-muted mt-2">{t('NoRolesInProject')}</p>
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
                                                    <i className="ri-more-2-fill fs-16"></i>
                                                </DropdownToggle>
                                                <DropdownMenu>
                                                    <DropdownItem onClick={() => handleEdit(role)}>
                                                        <i className="ri-edit-2-line me-2"></i> {t('Edit')}
                                                    </DropdownItem>
                                                    <DropdownItem onClick={() => {
                                                        if (projectId) {
                                                            navigate(`/projects/${projectId}/roles/${role.id}/permissions`);
                                                        }
                                                    }}>
                                                        <i className="ri-shield-user-line me-2"></i> {t('Permissions')}
                                                    </DropdownItem>
                                                    <DropdownItem divider />
                                                    <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                                        <i className="ri-delete-bin-5-line me-2"></i> {t('Delete')}
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
            {projectId && (
                <>
                    <CreateRoleModal
                        show={showCreate}
                        onClose={() => setShowCreate(false)}
                        onSubmit={async (values) => {
                            if (!projectId) return;
                            try {
                                await createProjectRole(projectId, values);
                                setShowCreate(false);
                                await queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
                            } catch (error: any) {
                                alert(error?.message || t('ErrorCreatingRole'));
                            }
                        }}
                    />
                    <EditRoleModal
                        show={showEdit}
                        onClose={() => {
                            setShowEdit(false);
                            setEditingRole(null);
                        }}
                        initial={editingRole ? {
                            code: editingRole.code || "",
                            name: editingRole.name || "",
                            description: editingRole.description || ""
                        } : { code: "" }}
                        onSubmit={async (values) => {
                            if (!projectId || !editingRole) return;
                            try {
                                await updateProjectRole(projectId, editingRole.id, values);
                                setShowEdit(false);
                                setEditingRole(null);
                                await queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
                            } catch (error: any) {
                                alert(error?.message || t('ErrorUpdatingRole'));
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default RoleTab;