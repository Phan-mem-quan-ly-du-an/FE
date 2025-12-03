import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Card, CardBody, CardHeader, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Alert } from 'reactstrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceMembers, WorkspaceMember, getWorkspaceById, Workspace, transferWorkspaceOwnership, deleteWorkspaceMember } from '../../apiCaller/workspaceDetails';
import TableContainer from '../../Components/Common/TableContainer';
import AddWorkspaceMemberModal from './AddWorkspaceMemberModal';
import { getWorkspaceRoles, WorkspaceRole } from '../../apiCaller/workspaceRoles';
import TransferOwnershipModal from './TransferOwnershipModal';
import { toast } from 'react-toastify';
import AssignWorkspaceRoleModal from './AssignWorkspaceRoleModal';
import { getUsersByIds, UserBrief } from '../../apiCaller/users';
import { useTranslation } from 'react-i18next';
import { isForbiddenError } from '../../helpers/permissions';

const MemberTab: React.FC = () => {
    const { t } = useTranslation();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const queryClient = useQueryClient();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [assignMember, setAssignMember] = useState<WorkspaceMember | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const toggleDropdown = useCallback((userId: string) => {
        setOpenDropdownId(prev => (prev === userId ? null : userId));
    }, []);

    // Transfer ownership modal state
    const [showTransfer, setShowTransfer] = useState(false);
    const [targetMember, setTargetMember] = useState<WorkspaceMember | null>(null);
    const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | ''>('');

    const {
        data: members = [],
        isLoading,
        error,
    } = useQuery<WorkspaceMember[]>({
        queryKey: ['workspace-members', workspaceId],
        queryFn: () => getWorkspaceMembers(workspaceId!),
        enabled: !!workspaceId,
    });
    
    // Sử dụng useEffect để debug dữ liệu khi members thay đổi
    React.useEffect(() => {
        if (members && members.length > 0) {
            console.log('API Response - Workspace Members:', members);
            // Kiểm tra từng thành viên và giá trị owner
            members.forEach((member: WorkspaceMember) => {
                console.log(`Member ${member.userId} - owner:`, member.owner, 'Type:', typeof member.owner);
            });
        }
    }, [members]);

    const { data: workspace } = useQuery<Workspace>({
        queryKey: ['workspace', workspaceId],
        queryFn: () => getWorkspaceById(workspaceId!),
        enabled: !!workspaceId,
        staleTime: 60_000,
    });

    const { data: roles = [] } = useQuery<WorkspaceRole[]>({
        queryKey: ['workspace-roles', workspaceId],
        queryFn: () => getWorkspaceRoles(workspaceId!),
        enabled: !!workspaceId,
        staleTime: 60_000,
    });

    // Fetch emails for member userIds to display in table
    const userIds = React.useMemo(() => Array.from(new Set((members || []).map(m => m.userId))).filter(Boolean), [members]);
    const { data: usersBrief = [] } = useQuery<UserBrief[]>({
        queryKey: ['users-brief', userIds.join(',')],
        queryFn: () => getUsersByIds(userIds),
        enabled: userIds.length > 0,
        staleTime: 60_000,
    });
    const idToEmail = React.useMemo(() => Object.fromEntries(usersBrief.map(u => [u.id, u.email])), [usersBrief]);

    // No owner-gating on the frontend; backend will enforce permissions

    const transferOwnershipMutation = useMutation({
        mutationFn: ({ workspaceId, toUserId, downgradeRoleId }: { workspaceId: string; toUserId: string; downgradeRoleId: number }) =>
            transferWorkspaceOwnership(workspaceId, { toUserId, downgradeRoleId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
        },
        onError: () => {}
    });

    const deleteMemberMutation = useMutation({
        mutationFn: async ({ userId }: { userId: string }) => {
            if (!workspaceId) throw new Error('No workspace ID');
            await deleteWorkspaceMember(workspaceId, userId);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
            toast.success(t('MemberDeletedSuccessfully'));
            setDeleteError(null);
        },
        onError: (e: any) => {
            if (isForbiddenError(e)) {
                const errorMsg = t('WorkspacePermissions.DeleteMemberDenied');
                setDeleteError(errorMsg);
                toast.warning(errorMsg, {
                    position: 'top-right',
                    autoClose: 5000,
                    style: { zIndex: 99999 }
                });
                return;
            }
            const errorMsg = e?.message || t('FailedDeleteMember');
            setDeleteError(errorMsg);
            toast.error(errorMsg, {
                position: 'top-right',
                autoClose: 5000,
                style: { zIndex: 99999 }
            });
        }
    });

    const columns = useMemo(
        () => [
            {
                header: '#',
                id: 'serial',
                enableColumnFilter: false,
                enableSorting: false,
                cell: (cell: any) => cell.row.index + 1,
            },
            {
                header: t('WorkspaceMemberEmail'),
                accessorKey: 'userId',
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const uid: string = cell.getValue();
                    const email = idToEmail[uid] || uid;
                    return <span className="font-monospace">{email}</span>;
                },
            },
            {
                header: t('MemberRole'),
                accessorKey: 'roleId',
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const m: WorkspaceMember = cell.row.original;
                    if (m.owner) {
                        return <span className="badge text-uppercase bg-success-subtle text-success">{t('Owner')}</span>;
                    }
                    const rid = m.roleId ?? m.role?.id;
                    const r = roles.find(rr => rr.id === rid);
                    const roleName = r ? (r.name || r.code) : (m.role?.name || (typeof rid === 'number' ? String(rid) : '—'));
                    return roleName ? (
                        <span className="badge text-uppercase bg-dark-subtle text-black">{roleName}</span>
                    ) : '—';
                },
            },
            {
                header: t('WorkspaceOwner'),
                accessorKey: 'owner',
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const member = cell.row.original;
                    // Xử lý các trường hợp khác nhau của giá trị owner
                    if (member.owner === true || member.owner === 'true' || member.owner === 1) {
                        return t('Owner');
                    } else {
                        return '—';
                    }
                },
            },

            {
                header: t('MemberActions'),
                id: 'action',
                enableColumnFilter: false,
                cell: (cellProps: any) => {
                    const m: WorkspaceMember = cellProps.row.original;
                    const isDeleting = deleteMemberMutation.isPending && deleteMemberMutation.variables?.userId === m.userId;
                    return (
                        <Dropdown isOpen={openDropdownId === m.userId} toggle={() => toggleDropdown(m.userId)}>
                            <DropdownToggle tag="button" className="btn btn-ghost-secondary btn-icon btn-sm" title={t('More')}>
                                <i className="ri-more-2-fill fs-16" />
                            </DropdownToggle>
                            <DropdownMenu strategy="fixed">
                                <DropdownItem disabled={m.owner} onClick={() => {
                                    setAssignMember(m);
                                    setShowAssign(true);
                                }}>
                                    <i className="ri-user-settings-line me-2" /> {t('AssignRole')}
                                </DropdownItem>
                                <DropdownItem disabled={m.owner} onClick={() => {
                                    setTargetMember(m);
                                    setSelectedDowngradeRoleId('');
                                    setShowTransfer(true);
                                }}>
                                    <i className="ri-exchange-line me-2" /> {t('TransferOwnership')}
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem disabled={m.owner || isDeleting} className="text-danger" onClick={() => {
                                    if (globalThis.confirm(t('ConfirmDeleteMember'))) {
                                        deleteMemberMutation.mutate({ userId: m.userId });
                                    }
                                }}>
                                    <i className="ri-delete-bin-line me-2" /> {isDeleting ? t('Deleting') : t('Delete')}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    );
                },
            },
        ],
        [openDropdownId, toggleDropdown, showAssign, setAssignMember, showTransfer, setShowTransfer, deleteMemberMutation, t, roles, idToEmail]
    );

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ blockSize: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingWorkspace')}</span>
            </div>
        );
    }

    if (error) {
        const forbidden = isForbiddenError(error);
        return (
            <div className={`alert ${forbidden ? 'alert-warning' : 'alert-danger'} text-center`}>
                <i className="ri-error-warning-line me-2" />
                {forbidden 
                    ? (t('WorkspacePermissions.ViewMembersDenied') || 'Bạn không có quyền xem thành viên của workspace.') 
                    : (t('FailedLoadMembers') || 'Failed to load members')}
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
                    <div className="d-flex align-items-center justify-content-between gap-2">
                        <h5 className="mb-0">{t('MembersList')}</h5>
                        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                            <i className="ri-user-add-line me-1" /> {t('AddMember')}
                        </button>
                    </div>
                </CardHeader>
                <CardBody>
                    <TableContainer
                        columns={columns}
                        data={members || []}
                        isGlobalFilter={true}
                        customPageSize={10}
                        divClass="table-responsive table-card mb-1 mt-0"
                        tableClass="align-middle table-nowrap"
                        theadClass="table-light text-muted text-uppercase"
                        SearchPlaceholder={t('SearchPlaceholder')}
                    />
                </CardBody>
            </Card>
            {showAdd && workspace?.companyId && workspaceId && (
                <AddWorkspaceMemberModal
                    show={showAdd}
                    onClose={() => setShowAdd(false)}
                    workspaceId={workspaceId}
                    companyId={workspace.companyId}
                    onSuccess={async () => {
                        await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
                        toast.success(t('MembersInvitedSuccessfully') || 'Mời thành viên thành công');
                    }}
                />
            )}
            {showAssign && workspaceId && (
                <AssignWorkspaceRoleModal
                    show={showAssign}
                    onClose={() => { setShowAssign(false); setAssignMember(null); }}
                    workspaceId={workspaceId}
                    member={assignMember}
                    memberEmail={assignMember ? (idToEmail[assignMember.userId] || undefined) : undefined}
                    onSuccess={(msg) => toast.success(msg)}
                    onError={(msg) => toast.error(msg)}
                />
            )}
            <TransferOwnershipModal
                show={showTransfer}
                onClose={() => {
                    setShowTransfer(false);
                    setTargetMember(null);
                    setSelectedDowngradeRoleId('');
                }}
                onConfirm={async () => {
                    if (!workspaceId || !targetMember || selectedDowngradeRoleId === '') return;
                    try {
                        await transferOwnershipMutation.mutateAsync({
                            workspaceId,
                            toUserId: targetMember.userId,
                            downgradeRoleId: Number(selectedDowngradeRoleId),
                        });
                        setShowTransfer(false);
                        setTargetMember(null);
                        setSelectedDowngradeRoleId('');
                    } catch (e: any) {
                        if (e?.name === 'ForbiddenError' || e?.message?.toLowerCase?.().includes('forbidden')) {
                            toast.warning(t('OnlyWorkspaceOwnerCanTransfer'));
                        } else {
                            toast.error(e?.message || t('ErrorTransferOwnership'));
                        }
                    }
                }}
                targetMember={targetMember}
                memberEmail={targetMember ? (idToEmail[targetMember.userId] || undefined) : undefined}
                roles={roles}
                selectedDowngradeRoleId={selectedDowngradeRoleId}
                onRoleChange={setSelectedDowngradeRoleId}
                isPending={transferOwnershipMutation.isPending}
            />
        </div>
    );
};

export default MemberTab;
