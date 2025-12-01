import {useEffect, useMemo, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import {
    CompanyMember,
    deleteCompanyMember,
    getCompanyMembers,
    getCompanyRoles,
    transferOwnership
} from '../../apiCaller/companyMembers';
import { isForbiddenError } from '../../helpers/permissions';
import { getUsersByIds, UserBrief } from '../../apiCaller/users';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import InviteMemberModal from './InviteMemberModal';
import TransferOwnershipModal from './TransferOwnershipModal';
import AssignRoleModal from './AssignRoleModal';
import MembersTable from './MembersTable';

export default function CompanyMemberPage() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    // Get company ID from URL params
    const { companyId } = useParams<{ companyId: string }>();
    // Unified toast for invite-permission denied
    const showInviteDeniedToast = () => {
        console.log('[DEBUG] showInviteDeniedToast called');
        toast.warning(
            (
                <div>
                    <div className="fw-semibold">
                        {t('CompanyPermissions.InviteMemberDeniedTitle') || 'Không có quyền'}
                    </div>
                    <div className="mt-1">
                        {t('CompanyPermissions.InviteMemberDeniedDetail') || 'Bạn không có quyền mời thành viên vào công ty này. Hãy liên hệ quản trị viên để được cấp quyền.'}
                    </div>
                </div>
            ),
            { 
                autoClose: 4000,
                position: 'top-right',
                style: {
                    minWidth: '350px'
                }
            }
        );
    };

    // React Query hooks
    const { data: members = [], error: membersError } = useQuery({
        queryKey: ['companyMembers', companyId],
        queryFn: () => getCompanyMembers(companyId!),
        enabled: !!companyId,
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId!, true),
        enabled: !!companyId,
    });

    const memberUserIds = useMemo(() => {
        const ids = members
            .map(member => member.userId)
            .filter((id): id is string => !!id);
        return Array.from(new Set(ids));
    }, [members]);

    const { data: usersBrief = [] } = useQuery<UserBrief[]>({
        queryKey: ['users-brief', memberUserIds],
        queryFn: () => getUsersByIds(memberUserIds),
        enabled: memberUserIds.length > 0,
        staleTime: 60_000,
    });

    const userEmailMap = useMemo(() => {
        const map: Record<string, string> = {};
        usersBrief.forEach(user => {
            map[user.id] = user.email;
        });
        return map;
    }, [usersBrief]);

    const resolvedMembers = useMemo<CompanyMember[]>(() => {
        return members.map(member => ({
            ...member,
            email: member.email ?? userEmailMap[member.userId] ?? member.invitedEmail ?? member.userId
        }));
    }, [members, userEmailMap]);

    // Mutations
    const deleteMemberMutation = useMutation({
        mutationFn: ({ companyId, userId }: { companyId: string; userId: string }) =>
            deleteCompanyMember(companyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyMembers', companyId] });
        },
    });

    const transferOwnershipMutation = useMutation({
        mutationFn: ({ companyId, transferData }: { companyId: string; transferData: any }) =>
            transferOwnership(companyId, transferData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyMembers', companyId] });
        },
    });

    // State management
    const [msg, setMsg] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Transfer ownership modal states
    const [showTransfer, setShowTransfer] = useState(false);
    const [targetMember, setTargetMember] = useState<CompanyMember | null>(null);
    const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | ''>('');

    // Invite member modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    // Permission check states for invite action
    // Explicit literal union to avoid TS narrowing complaints
    const [canInvite, setCanInvite] = useState<false | true | null>(null); // null = unknown, true/false = determined
    const [checkingInvitePermission, setCheckingInvitePermission] = useState(false);

    // Pre-fetch permission once
    useEffect(() => {
        if (!companyId) return;
        const check = async () => {
            setCheckingInvitePermission(true);
            try {
                await getCompanyRoles(companyId, true);
                console.log('[DEBUG] Permission check: canInvite = true');
                setCanInvite(true);
            } catch (err: any) {
                if (isForbiddenError(err)) {
                    console.log('[DEBUG] Permission check: canInvite = false (403 Forbidden)');
                    setCanInvite(false);
                } else {
                    console.log('[DEBUG] Permission check error (not 403):', err);
                    // Non-permission error – keep unknown so user can retry
                    setCanInvite(null);
                }
            } finally {
                setCheckingInvitePermission(false);
            }
        };
        check();
    }, [companyId]);

    // Assign role modal states
    const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
    const [assignRoleMember, setAssignRoleMember] = useState<CompanyMember | null>(null);

    // Event handlers
    const handleDelete = async (member: CompanyMember) => {
        if (!companyId) return;
        if (member.owner) {
            setMsg(t('CannotDeleteOwner'));
            return;
        }
        if (!window.confirm(t('DeleteMemberConfirm', { userId: member.userId }))) return;

        try {
            setDeletingUserId(member.userId);
            await deleteMemberMutation.mutateAsync({ companyId, userId: member.userId });
        } catch (e: any) {
            setMsg(e?.message || t('DeleteError'));
        } finally {
            setDeletingUserId(null);
        }
    };

    const openTransferModal = (member: CompanyMember) => {
        if (!companyId) return;
        if (member.owner) {
            setMsg(t('MemberAlreadyOwner'));
            return;
        }

        setMsg(null);
        setTargetMember(member);
        setSelectedDowngradeRoleId('');
        setShowTransfer(true);
    };

    const closeTransferModal = () => {
        setShowTransfer(false);
        setTargetMember(null);
        setSelectedDowngradeRoleId('');
    };

    const openInviteModal = async () => {
        if (!companyId) return;
        setMsg(null);

        console.log('[DEBUG] openInviteModal - canInvite:', canInvite);

        // Known no permission
        if (canInvite === false) {
            console.log('[DEBUG] Showing permission denied toast');
            showInviteDeniedToast();
            return;
        }

        // Unknown: re-check live
        if (canInvite === null) {
            setCheckingInvitePermission(true);
            try {
                await queryClient.fetchQuery({
                    queryKey: ['company-roles-permission-check', companyId, Date.now()],
                    queryFn: () => getCompanyRoles(companyId, true),
                    staleTime: 0,
                });
                setCanInvite(true);
            } catch (error: any) {
                if (isForbiddenError(error)) {
                    setCanInvite(false);
                    showInviteDeniedToast();
                    return;
                } else {
                    toast.error(error?.message || 'Không thể kiểm tra quyền mời thành viên', { autoClose: 3000 });
                    return;
                }
            } finally {
                setCheckingInvitePermission(false);
            }
        }

        setShowInviteModal(true);
    };

    const handleInviteError = (error: any) => {
        if (isForbiddenError(error)) {
            toast.warning(t('CompanyPermissions.InviteMemberDenied') || 'Bạn không có quyền mời thành viên vào công ty', { autoClose: 3000 });
        } else {
            toast.error(error?.message || t('InviteError'), { autoClose: 3000 });
        }
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
    };

    const confirmTransfer = async () => {
        if (!companyId || !targetMember) return;
        if (selectedDowngradeRoleId === '') {
            setMsg(t('PleaseSelectRoleForOldOwner'));
            return;
        }

        setMsg(null);
        try {
            await transferOwnershipMutation.mutateAsync({
                companyId,
                transferData: {
                    toUserId: targetMember.userId,
                    downgradeRoleId: selectedDowngradeRoleId as number,
                }
            });
            closeTransferModal();
        } catch (e: any) {
            setMsg(e?.message || t('TransferOwnerError'));
        }
    };

    // Assign role modal handlers
    const openAssignRoleModal = (member: CompanyMember) => {
        setAssignRoleMember(member);
        setShowAssignRoleModal(true);
    };

    const closeAssignRoleModal = () => {
        setShowAssignRoleModal(false);
        setAssignRoleMember(null);
    };

    const filteredMembers = useMemo(() => {
        const query = memberSearch.trim().toLowerCase();
        if (!query) return resolvedMembers;

        return resolvedMembers.filter(member => {
            const email = member.email?.toLowerCase() || '';
            const invited = member.invitedEmail?.toLowerCase() || '';
            const userId = member.userId?.toLowerCase() || '';
            const roleName = roles?.find(r => r.id === member.roleId)?.name?.toLowerCase() || '';
            return email.startsWith(query)
                || invited.startsWith(query)
                || userId.startsWith(query)
                || roleName.startsWith(query);
        });
    }, [memberSearch, resolvedMembers, roles]);


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('CompanyMembers')} pageTitle={t('CompanyMembers')} />

                {/* Messages */}
                {(msg || membersError) && (
                    <Row className="mb-3">
                        <Col>
                            <div className={`alert ${membersError ? 'alert-danger' : 'alert-info'} mb-0`}>
                                {msg || membersError?.message}
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Members Table */}
                <Row>
                    <Col>
                        <Card>
                            <CardHeader className="card-header border-0">
                                <Row className="align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">{t('MembersList')}</h5>
                                    </div>
                                    <div className="col-sm-auto">
                                        <div className="d-flex gap-1 flex-wrap align-items-center">
                                            <div className="search-box me-2 mb-2 d-inline-block">
                                                <input
                                                    type="search"
                                                    className="form-control search"
                                                    placeholder={t('SearchMembersPlaceholder') || ''}
                                                    value={memberSearch}
                                                    onChange={(event) => setMemberSearch(event.target.value)}
                                                />
                                                <i className="bx bx-search-alt search-icon"></i>
                                            </div>
                                            <button
                                                type="button"
                                                className={`btn btn-primary position-relative ${canInvite === false ? 'btn-soft-primary' : ''}`}
                                                onClick={openInviteModal}
                                                aria-disabled={canInvite === false}
                                            >
                                                <i className="ri-user-add-line me-1"></i>
                                                {checkingInvitePermission ? (t('CheckingPermission') || 'Checking...') : t('AddMember')}
                                                {canInvite === false && (
                                                    <span className="ms-2 badge bg-warning-subtle text-warning" style={{ fontSize: '.65rem' }}>
                                                        {t('NoPermission') || 'NO PERMISSION'}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </Row>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <MembersTable
                                    members={filteredMembers}
                                    companyId={companyId!}
                                    roles={roles}
                                    deletingUserId={deletingUserId}
                                    onDelete={handleDelete}
                                    onTransferOwnership={openTransferModal}
                                    onAssignRole={openAssignRoleModal}
                                    deleteMemberMutation={deleteMemberMutation}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Modals */}
                <TransferOwnershipModal
                    show={showTransfer}
                    onClose={closeTransferModal}
                    onConfirm={confirmTransfer}
                    targetMember={targetMember}
                    roles={roles}
                    selectedDowngradeRoleId={selectedDowngradeRoleId}
                    onRoleChange={setSelectedDowngradeRoleId}
                    isPending={transferOwnershipMutation.isPending}
                />

                <InviteMemberModal
                    show={showInviteModal}
                    onClose={closeInviteModal}
                    companyId={companyId!}
                    onSuccess={(message) => setMsg(message)}
                    onError={handleInviteError}
                />

                <AssignRoleModal
                    show={showAssignRoleModal}
                    onClose={closeAssignRoleModal}
                    companyId={companyId!}
                    member={assignRoleMember}
                    onSuccess={(message) => {
                        setMsg(message);
                        closeAssignRoleModal();
                    }}
                    onError={(message) => setMsg(message)}
                />
            </Container>
        </div>
    );
}