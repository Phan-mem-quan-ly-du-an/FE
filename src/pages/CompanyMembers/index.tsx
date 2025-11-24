import {useEffect, useMemo, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap';
import { useTranslation } from 'react-i18next';

import {
    CompanyMember,
    deleteCompanyMember,
    getCompanyMembers,
    getCompanyRoles,
    transferOwnership
} from '../../apiCaller/companyMembers';
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

    const openInviteModal = () => {
        if (!companyId) return;
        setMsg(null);
        setShowInviteModal(true);
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
                                            <button className="btn btn-primary" onClick={openInviteModal}>
                                                <i className="ri-user-add-line me-1"></i>
                                                {t('AddMember')}
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
                    onError={(message) => setMsg(message)}
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