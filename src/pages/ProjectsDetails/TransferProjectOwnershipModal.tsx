import React from 'react';
import { ProjectRole } from '../../apiCaller/projectRoles';

interface TransferProjectOwnershipModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetMember: {
        userId: string;
    } | null;
    roles: ProjectRole[];
    selectedDowngradeRoleId: number | '';
    onRoleChange: (roleId: number | '') => void;
    isPending: boolean;
}

export default function TransferProjectOwnershipModal({
    show,
    onClose,
    onConfirm,
    targetMember,
    roles,
    selectedDowngradeRoleId,
    onRoleChange,
    isPending
}: TransferProjectOwnershipModalProps) {
    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Transfer project ownership</h5>
                            <button type="button" className="btn-close" aria-label="Close"
                                    onClick={onClose}/>
                        </div>
                        <div className="modal-body">
                            <p className="mb-2">
                                Transfer ownership of the project to: <span
                                className="font-monospace">{targetMember?.userId}</span>
                            </p>
                            <div className="mb-3">
                                <label className="form-label">New role for the former owner (within the project)</label>
                                <select
                                    className="form-select"
                                    value={selectedDowngradeRoleId === '' ? '' : String(selectedDowngradeRoleId)}
                                    onChange={(e) =>
                                        onRoleChange(e.target.value ? Number(e.target.value) : '')
                                    }
                                >
                                    <option value="">— Select a role —</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name || r.code}
                                        </option>
                                    ))}
                                </select>
                                <div className="form-text">
                                    You must select a role to assign to the former owner after the transfer.
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