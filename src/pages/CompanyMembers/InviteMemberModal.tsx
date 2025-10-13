import React, {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {batchInviteMembers, getCompanyRoles, Role} from '../../apiCaller/companyMembers';

interface InviteMemberModalProps {
    show: boolean;
    onClose: () => void;
    companyId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}


export default function InviteMemberModal({
                                              show,
                                              onClose,
                                              companyId,
                                              onSuccess,
                                              onError
                                          }: InviteMemberModalProps) {
    const queryClient = useQueryClient();

    // States for invite member modal
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
    const [inviteResults, setInviteResults] = useState<Array<{ email: string, success: boolean, message: string }>>([]);
    const [msg, setMsg] = useState<string | null>(null);

    // Get roles for the company
    const {data: roles = []} = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
        enabled: !!companyId && show,
    });

    const batchInviteMutation = useMutation({
        mutationFn: ({companyId, emails, roleId}: { companyId: string; emails: string[]; roleId: number }) =>
            batchInviteMembers(companyId, emails, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companyMembers', companyId]});
        },
    });

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
                const successMessage = `Mời thành công ${successCount}/${inviteEmails.length} thành viên!`;
                setMsg(successMessage);
                onSuccess?.(successMessage);
            } else {
                const errorMessage = 'Không có thành viên nào được mời thành công';
                setMsg(errorMessage);
                onError?.(errorMessage);
            }
        } catch (e: any) {
            const errorMessage = e?.message || 'Có lỗi khi mời thành viên';
            setMsg(errorMessage);
            onError?.(errorMessage);
        }
    }

    function handleClose() {
        setInviteEmails([]);
        setEmailInput('');
        setSelectedRoleId('');
        setInviteResults([]);
        setMsg(null);
        onClose();
    }

    if (!show) return null;

    return (
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
                                onClick={handleClose}
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

                            {/* Message display */}
                            {msg && (
                                <div className="row">
                                    <div className="col-12">
                                        <div
                                            className={`alert ${msg.includes('thành công') ? 'alert-success' : 'alert-danger'} mb-3`}>
                                            {msg}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                            {roles.map((role: Role) => (
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
                                onClick={handleClose}
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
    );
}
