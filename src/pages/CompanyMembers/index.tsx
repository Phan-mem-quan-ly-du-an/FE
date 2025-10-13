import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import BreadCrumb from '../../Components/Common/BreadCrumb';
import InviteMemberModal from './InviteMemberModal';
import TransferOwnershipModal from './TransferOwnershipModal';
import MembersTable from './MembersTable';

export default function CompanyMemberPage() {
    const navigate = useNavigate();
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

    // Event handlers
    const handleDelete = async (member: CompanyMember) => {
        if (!companyId) return;
        if (member.owner) {
            setMsg('Không thể xoá Owner');
            return;
        }
        if (!window.confirm(`Xoá thành viên ${member.userId} khỏi công ty?`)) return;

        try {
            setDeletingUserId(member.userId);
            await deleteMemberMutation.mutateAsync({ companyId, userId: member.userId });
        } catch (e: any) {
            setMsg(e?.message || 'Có lỗi khi xoá');
        } finally {
            setDeletingUserId(null);
        }
    };

    const openTransferModal = (member: CompanyMember) => {
        if (!companyId) return;
        if (member.owner) {
            setMsg('Thành viên này đã là Owner');
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
            setMsg('Vui lòng chọn role cho Owner cũ (downgrade)');
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
            setMsg(e?.message || 'Có lỗi khi transfer owner');
        }
    };


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
                                        <div className="d-flex gap-1 flex-wrap">
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => navigate(`/companies/${companyId}/roles`)}
                                            >
                                                {t('RolePermissionManagement')}
                                            </button>
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
                                    members={members}
                                    companyId={companyId!}
                                    deletingUserId={deletingUserId}
                                    onDelete={handleDelete}
                                    onTransferOwnership={openTransferModal}
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
            </Container>
        </div>
    );
}