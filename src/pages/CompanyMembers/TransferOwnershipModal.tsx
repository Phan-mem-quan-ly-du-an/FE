import React from 'react';
import {Role} from '../../apiCaller/companyMembers';

interface TransferOwnershipModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetMember: {
        userId: string;
    } | null;
    roles: Role[];
    selectedDowngradeRoleId: number | '';
    onRoleChange: (roleId: number | '') => void;
    isPending: boolean;
}

export default function TransferOwnershipModal({
    show,
    onClose,
    onConfirm,
    targetMember,
    roles,
    selectedDowngradeRoleId,
    onRoleChange,
    isPending
}: TransferOwnershipModalProps) {
    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Transfer ownership</h5>
                            <button type="button" className="btn-close" aria-label="Close"
                                    onClick={onClose}/>
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
                                        onRoleChange(e.target.value ? Number(e.target.value) : '')
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
                            <button className="btn btn-secondary" onClick={onClose}
                                    disabled={isPending}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={onConfirm}
                                    disabled={isPending}>
                                {isPending ? 'Transferring...' : 'Confirm Transfer'}
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
