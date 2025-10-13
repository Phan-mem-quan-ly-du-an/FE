import {useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
    CompanyMember,
    deleteCompanyMember,
    getCompanyMembers,
    getCompanyRoles,
    transferOwnership
} from '../../apiCaller/companyMembers';
import InviteMemberModal from './InviteMemberModal';
import MembersTable from './MembersTable';
import TransferOwnershipModal from './TransferOwnershipModal';
import PageHeader from './PageHeader';

export default function CompanyMemberPage() {
    const navigate = useNavigate();
    const params = useParams();
    const queryClient = useQueryClient();

    const companyId = useMemo(() => {
        return (
            (params as any).companyId ||
            (params as any).id ||
            window.location.pathname.match(/\/companies\/([^/]+)/)?.[1] ||
            ''
        );
    }, [params]);

    // React Query hooks
    const {data: members = [], isLoading: membersLoading, error: membersError} = useQuery({
        queryKey: ['companyMembers', companyId],
        queryFn: () => getCompanyMembers(companyId),
        enabled: !!companyId,
    });

    const {data: roles = []} = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
        enabled: !!companyId,
    });

    // Mutations
    const deleteMemberMutation = useMutation({
        mutationFn: ({companyId, userId}: { companyId: string; userId: string }) =>
            deleteCompanyMember(companyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companyMembers', companyId]});
        },
    });

    const transferOwnershipMutation = useMutation({
        mutationFn: ({companyId, transferData}: { companyId: string; transferData: any }) =>
            transferOwnership(companyId, transferData),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companyMembers', companyId]});
        },
    });


    const [msg, setMsg] = useState<string | null>(null);

    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const [showTransfer, setShowTransfer] = useState(false);
    const [targetMember, setTargetMember] = useState<CompanyMember | null>(null);
    const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | ''>('');

    // States for invite member modal
    const [showInviteModal, setShowInviteModal] = useState(false);

    async function handleDelete(member: CompanyMember) {
        if (!companyId) return;
        if (member.owner) {
            setMsg('Không thể xoá Owner');
            return;
        }
        if (!window.confirm(`Xoá thành viên ${member.userId} khỏi công ty?`)) return;

        try {
            setDeletingUserId(member.userId);
            await deleteMemberMutation.mutateAsync({companyId, userId: member.userId});
        } catch (e: any) {
            setMsg(e?.message || 'Có lỗi khi xoá');
        } finally {
            setDeletingUserId(null);
        }
    }

    async function openTransferModal(member: CompanyMember) {
        if (!companyId) return;
        if (member.owner) {
            setMsg('Thành viên này đã là Owner');
            return;
        }

        setMsg(null);
        setTargetMember(member);
        setSelectedDowngradeRoleId('');
        setShowTransfer(true);
    }

    function closeTransferModal() {
        setShowTransfer(false);
        setTargetMember(null);
        setSelectedDowngradeRoleId('');
    }

    function openInviteModal() {
        if (!companyId) return;
        setMsg(null);
        setShowInviteModal(true);
    }

    function closeInviteModal() {
        setShowInviteModal(false);
    }

    async function confirmTransfer() {
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
    }

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Row: Title / Actions top-right */}
                <PageHeader
                    companyId={companyId}
                    onAddMember={openInviteModal}
                    onBack={() => navigate('/companies')}
                />

                {/* Row: Message */}
                {(msg || membersError) && (
                    <div className="row">
                        <div className="col-12">
                            <div className={`alert ${membersError ? 'alert-danger' : 'alert-info'} mt-3 mb-0`}>
                                {msg || membersError?.message}
                            </div>
                        </div>
                    </div>
                )}

                {/* Row: Table */}
                <MembersTable
                    members={members}
                    loading={membersLoading}
                    companyId={companyId}
                    deletingUserId={deletingUserId}
                    onDelete={handleDelete}
                    onTransferOwnership={openTransferModal}
                    deleteMemberMutation={deleteMemberMutation}
                />

                {/* Transfer ownership modal */}
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

                {/* Invite Member Modal */}
                <InviteMemberModal
                    show={showInviteModal}
                    onClose={closeInviteModal}
                    companyId={companyId}
                    onSuccess={(message) => setMsg(message)}
                    onError={(message) => setMsg(message)}
                />
            </div>
        </div>
    );
}
