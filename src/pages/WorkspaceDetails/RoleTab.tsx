import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button, Spinner, Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getWorkspaceRoles, WorkspaceRole, deleteWorkspaceRole, createWorkspaceRole, updateWorkspaceRole } from '../../apiCaller/workspaceRoles';
import CreateRoleModal from '../Companies/Roles/CreateRoleModal';
import EditRoleModal from '../Companies/Roles/EditRoleModal';

const RoleTab: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingRole, setEditingRole] = useState<WorkspaceRole | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

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
        if (window.confirm(`Are you sure you want to delete role "${role.name || role.code}"?`)) {
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
            header: 'Role ID',
            accessorKey: 'id',
            enableColumnFilter: false,
            cell: (info: any) => <span className="font-monospace">{info.getValue()}</span>,
        },
        {
            header: 'Name',
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
                const role: WorkspaceRole = row.original;
                return (
                    <Dropdown 
                        isOpen={openDropdownId === role.id} 
                        toggle={() => toggleDropdown(role.id)}
                    >
                        <DropdownToggle 
                            tag="button" 
                            className="btn btn-ghost-secondary btn-icon btn-sm"
                            title="More options"
                        >
                            <i className="ri-more-2-fill fs-16"></i>
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem onClick={() => handleEdit(role)}>
                                <i className="ri-edit-2-line me-2"></i> Edit
                            </DropdownItem>
                            <DropdownItem onClick={() => {
                                if (workspaceId) {
                                    navigate(`/workspaces/${workspaceId}/roles/${role.id}/permissions`);
                                }
                            }}>
                                <i className="ri-shield-user-line me-2"></i> Permissions
                            </DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                <i className="ri-delete-bin-5-line me-2"></i> Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            },
        },
    ], [workspaceId, navigate, openDropdownId]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">Loading roles...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger text-center">
                <i className="ri-error-warning-line me-2"></i>
                Failed to load roles
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Workspace Roles</h5>
                        <div>
                            <Button color="success" size="sm" className="me-2" onClick={() => setShowCreate(true)}>
                                <i className="ri-add-line me-1"></i> Create Role
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {roles.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="ri-shield-line fs-1 text-muted"></i>
                            <p className="text-muted mt-2">No roles in this workspace yet.</p>
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
                                        <td><span className="font-monospace">{role.id}</span></td>
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
                                                        <i className="ri-edit-2-line me-2"></i> Edit
                                                    </DropdownItem>
                                                    <DropdownItem onClick={() => {
                                                        if (workspaceId) {
                                                            navigate(`/workspaces/${workspaceId}/roles/${role.id}/permissions`);
                                                        }
                                                    }}>
                                                        <i className="ri-shield-user-line me-2"></i> Permissions
                                                    </DropdownItem>
                                                    <DropdownItem divider />
                                                    <DropdownItem onClick={() => handleDelete(role)} className="text-danger">
                                                        <i className="ri-delete-bin-5-line me-2"></i> Delete
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
                        onClose={() => setShowCreate(false)}
                        onSubmit={async (values) => {
                            if (!workspaceId) return;
                            try {
                                await createWorkspaceRole(workspaceId, values);
                                setShowCreate(false);
                                await queryClient.invalidateQueries({ queryKey: ['workspace-roles', workspaceId] });
                            } catch (error: any) {
                                alert(error?.message || 'Error creating role');
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
                            if (!workspaceId || !editingRole) return;
                            try {
                                await updateWorkspaceRole(workspaceId, editingRole.id, values);
                                setShowEdit(false);
                                setEditingRole(null);
                                await queryClient.invalidateQueries({ queryKey: ['workspace-roles', workspaceId] });
                            } catch (error: any) {
                                alert(error?.message || 'Error updating role');
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default RoleTab;

