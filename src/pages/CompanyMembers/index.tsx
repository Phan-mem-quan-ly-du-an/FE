import {useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
    batchInviteMembers,
    CompanyMember,
    deleteCompanyMember,
    getCompanyMembers,
    getCompanyRoles,
    Role,
    transferOwnership
} from '../../apiCaller/companyMembers';

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
    const { data: members = [], isLoading: membersLoading, error: membersError } = useQuery({
        queryKey: ['companyMembers', companyId],
        queryFn: () => getCompanyMembers(companyId),
        enabled: !!companyId,
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
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

    const batchInviteMutation = useMutation({
        mutationFn: ({ companyId, emails, roleId }: { companyId: string; emails: string[]; roleId: number }) => 
            batchInviteMembers(companyId, emails, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyMembers', companyId] });
        },
    });

    const [msg, setMsg] = useState<string | null>(null);

    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const [showTransfer, setShowTransfer] = useState(false);
    const [targetMember, setTargetMember] = useState<CompanyMember | null>(null);
    const [selectedDowngradeRoleId, setSelectedDowngradeRoleId] = useState<number | ''>('');

    // States for invite member modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
    const [inviteResults, setInviteResults] = useState<Array<{ email: string, success: boolean, message: string }>>([]);

    async function handleDelete(member: CompanyMember) {
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

    async function openInviteModal() {
        if (!companyId) return;

        setMsg(null);
        setInviteEmails([]);
        setEmailInput('');
        setSelectedRoleId('');
        setInviteResults([]);
        setShowInviteModal(true);
    }

    function closeInviteModal() {
        setShowInviteModal(false);
        setInviteEmails([]);
        setEmailInput('');
        setSelectedRoleId('');
        setInviteResults([]);
    }

    function addEmail() {
        const email = emailInput.trim().toLowerCase();
        if (!email) return;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMsg('Email không hợp lệ: ' + email);
            return;
        }

        // Check if email already exists
        if (inviteEmails.includes(email)) {
            setMsg('Email đã được thêm: ' + email);
            return;
        }

        setInviteEmails([...inviteEmails, email]);
        setEmailInput('');
        setMsg(null);
    }

    function removeEmail(emailToRemove: string) {
        setInviteEmails(inviteEmails.filter(email => email !== emailToRemove));
    }

    function handleEmailInputKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail();
        }
    }

    async function handleInviteMember() {
        if (!companyId) return;
        if (inviteEmails.length === 0) {
            setMsg('Vui lòng thêm ít nhất một email');
            return;
        }
        if (selectedRoleId === '') {
            setMsg('Vui lòng chọn vai trò');
            return;
        }

        setMsg(null);
        setInviteResults([]);

        try {
            const results = await batchInviteMutation.mutateAsync({ 
                companyId, 
                emails: inviteEmails, 
                roleId: selectedRoleId as number 
            });
            setInviteResults(results);

            const successCount = results.filter(r => r.success).length;
            if (successCount > 0) {
                setMsg(`Mời thành công ${successCount}/${inviteEmails.length} thành viên!`);
            } else {
                setMsg('Không có thành viên nào được mời thành công');
            }
        } catch (e: any) {
            setMsg(e?.message || 'Có lỗi khi mời thành viên');
        }
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
                <div className="row">
                    <div className="col-12 d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Company Members</h4>
                        <div className="d-flex gap-2">
                            <Link to={`/companies/${companyId}/roles`} className="btn btn-primary">
                                Role &amp; Permission Management
                            </Link>
                            <button className="btn btn-primary" onClick={openInviteModal}>
                                <i className="ri-user-add-line me-1"></i>
                                Add Member
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/companies')}>
                                Back
                            </button>
                        </div>
                    </div>
                </div>

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
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                <tr>
                                    <th style={{width: 60}}>#</th>
                                    <th>User ID</th>
                                    <th>Role ID</th>
                                    <th>Owner?</th>
                                    <th>Invited Email</th>
                                    <th>Joined At</th>
                                    <th style={{width: 260}}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {membersLoading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                {!membersLoading && members.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-5">
                                            No members
                                        </td>
                                    </tr>
                                )}
                                {!membersLoading &&
                                    members.map((m, idx) => (
                                        <tr key={m.id}>
                                            <td>{idx + 1}</td>
                                            <td className="font-monospace">{m.userId}</td>
                                            <td>{m.owner ? <span
                                                className="badge bg-success">Owner</span> : (m.roleId ?? '—')}</td>
                                            <td>{m.owner ? 'Yes' : 'No'}</td>
                                            <td>{m.invitedEmail ?? '—'}</td>
                                            <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : '—'}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <Link
                                                        className="btn btn-sm btn-outline-primary"
                                                        to={`/companies/${companyId}/members/${encodeURIComponent(m.userId)}/assign-role`}
                                                    >
                                                        Assign role
                                                    </Link>

                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(m)}
                                                        disabled={m.owner || deletingUserId === m.userId || deleteMemberMutation.isPending}
                                                    >
                                                        {deletingUserId === m.userId ? 'Deleting...' : 'Delete'}
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => openTransferModal(m)}
                                                        disabled={m.owner}
                                                        title="Transfer ownership"
                                                    >
                                                        Transfer owner
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Transfer ownership modal */}
                {showTransfer && (
                    <>
                        <div className="modal d-block" tabIndex={-1} role="dialog">
                            <div className="modal-dialog" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Transfer ownership</h5>
                                        <button type="button" className="btn-close" aria-label="Close"
                                                onClick={closeTransferModal}/>
                                    </div>
                                    <div className="modal-body">
                                        <p className="mb-2">
                                            Chuyển quyền Owner cho: <span
                                            className="font-monospace">{targetMember?.userId}</span>
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label">Role cho Owner hiện tại (downgrade)</label>
                                            <select
                                                className="form-select"
                                                value={selectedDowngradeRoleId === '' ? '' : String(selectedDowngradeRoleId)}
                                                onChange={(e) =>
                                                    setSelectedDowngradeRoleId(e.target.value ? Number(e.target.value) : '')
                                                }
                                            >
                                                <option value="">— Chọn role —</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.code}
                                                        {r.name ? ` (${r.name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text">
                                                Bạn phải chọn role để gán cho Owner cũ sau khi chuyển quyền.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={closeTransferModal}
                                                disabled={transferOwnershipMutation.isPending}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary" onClick={confirmTransfer}
                                                disabled={transferOwnershipMutation.isPending}>
                                            {transferOwnershipMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* backdrop */}
                        <div className="modal-backdrop fade show"></div>
                    </>
                )}

                {/* Invite Member Modal */}
                {showInviteModal && (
                    <>
                        <div className="modal d-block" tabIndex={-1} role="dialog">
                            <div className="modal-dialog modal-lg" role="document">
                                <div className="modal-content shadow-lg border-0">
                                    <div className="modal-header bg-primary text-white">
                                        <h5 className="modal-title d-flex align-items-center">
                                            <i className="ri-user-add-line me-2"></i>
                                            Mời thành viên mới
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            aria-label="Close"
                                            onClick={closeInviteModal}
                                        />
                                    </div>
                                    <div className="modal-body p-4">
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="alert alert-info d-flex align-items-center mb-4">
                                                    <i className="ri-information-line me-2"></i>
                                                    <div>
                                                        <strong>Thông tin:</strong> Chỉ có thể mời những người đã đăng
                                                        ký tài khoản trong hệ thống.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label htmlFor="emailInput" className="form-label fw-semibold">
                                                    <i className="ri-mail-line me-1"></i>
                                                    Email thành viên
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="ri-user-line"></i>
                                                    </span>
                                                    <input
                                                        type="email"
                                                        className="form-control form-control-lg"
                                                        id="emailInput"
                                                        placeholder="Nhập email và nhấn Enter hoặc click +"
                                                        value={emailInput}
                                                        onChange={(e) => setEmailInput(e.target.value)}
                                                        onKeyPress={handleEmailInputKeyPress}
                                                        disabled={batchInviteMutation.isPending}
                                                    />
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        type="button"
                                                        onClick={addEmail}
                                                        disabled={batchInviteMutation.isPending || !emailInput.trim()}
                                                    >
                                                        <i className="ri-add-line"></i>
                                                    </button>
                                                </div>
                                                <div className="form-text">
                                                    Email phải đã được đăng ký trong hệ thống. Có thể thêm nhiều email.
                                                </div>
                                            </div>

                                            {/* Danh sách email đã thêm */}
                                            {inviteEmails.length > 0 && (
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">
                                                        <i className="ri-list-check me-1"></i>
                                                        Danh sách email ({inviteEmails.length})
                                                    </label>
                                                    <div className="border rounded p-3 bg-light"
                                                         style={{maxHeight: '200px', overflowY: 'auto'}}>
                                                        {inviteEmails.map((email, index) => (
                                                            <div key={index}
                                                                 className="d-flex align-items-center justify-content-between mb-2 p-2 bg-white rounded border">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-mail-line me-2 text-primary"></i>
                                                                    <span className="font-monospace">{email}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeEmail(email)}
                                                                    disabled={batchInviteMutation.isPending}
                                                                >
                                                                    <i className="ri-close-line"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-12">
                                                <label htmlFor="selectedRole" className="form-label fw-semibold">
                                                    <i className="ri-shield-user-line me-1"></i>
                                                    Vai trò
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="ri-settings-3-line"></i>
                                                    </span>
                                                    <select
                                                        className="form-select form-select-lg"
                                                        id="selectedRole"
                                                        value={selectedRoleId === '' ? '' : String(selectedRoleId)}
                                                        onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                                                        disabled={batchInviteMutation.isPending}
                                                    >
                                                        <option value="">— Chọn vai trò —</option>
                                                        {roles.map((role) => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.code}
                                                                {role.name ? ` - ${role.name}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-text">
                                                    Chọn vai trò phù hợp cho thành viên mới
                                                </div>
                                            </div>
                                        </div>

                                        {roles.length === 0 && (
                                            <div className="alert alert-warning mt-3">
                                                <i className="ri-alert-line me-2"></i>
                                                Không có vai trò nào khả dụng. Vui lòng tạo vai trò trước khi mời thành
                                                viên.
                                            </div>
                                        )}

                                        {/* Hiển thị kết quả mời */}
                                        {inviteResults.length > 0 && (
                                            <div className="col-12 mt-3">
                                                <label className="form-label fw-semibold">
                                                    <i className="ri-checkbox-circle-line me-1"></i>
                                                    Kết quả mời
                                                </label>
                                                <div className="border rounded p-3 bg-light"
                                                     style={{maxHeight: '200px', overflowY: 'auto'}}>
                                                    {inviteResults.map((result, index) => (
                                                        <div key={index}
                                                             className={`d-flex align-items-center justify-content-between mb-2 p-2 rounded border ${
                                                                 result.success ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'
                                                             }`}>
                                                            <div className="d-flex align-items-center">
                                                                <i className={`me-2 ${result.success ? 'ri-check-line text-success' : 'ri-close-line text-danger'}`}></i>
                                                                <span className="font-monospace">{result.email}</span>
                                                            </div>
                                                            <div className="text-end">
                                                                <small
                                                                    className={`${result.success ? 'text-success' : 'text-danger'}`}>
                                                                    {result.message}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer bg-light border-0 p-4">
                                        <button
                                            className="btn btn-outline-secondary btn-lg px-4"
                                            onClick={closeInviteModal}
                                            disabled={batchInviteMutation.isPending}
                                        >
                                            <i className="ri-close-line me-1"></i>
                                            Hủy
                                        </button>
                                        <button
                                            className="btn btn-primary btn-lg px-4"
                                            onClick={handleInviteMember}
                                            disabled={batchInviteMutation.isPending || roles.length === 0 || inviteEmails.length === 0}
                                        >
                                            {batchInviteMutation.isPending ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"
                                                          role="status" aria-hidden="true"></span>
                                                    Đang mời {inviteEmails.length} thành viên...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-send-plane-line me-1"></i>
                                                    Gửi lời mời {inviteEmails.length > 0 && `(${inviteEmails.length})`}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* backdrop */}
                        <div className="modal-backdrop fade show"></div>
                    </>
                )}
            </div>
        </div>
    );
}
