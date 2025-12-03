import React from 'react';
import { useTranslation } from 'react-i18next';
import { WorkspaceRole } from '../../apiCaller/workspaceRoles';

interface TransferOwnershipModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetMember: {
        userId: string;
    } | null;
    memberEmail?: string;
    roles: WorkspaceRole[];
    selectedDowngradeRoleId: number | '';
    onRoleChange: (roleId: number | '') => void;
    isPending: boolean;
}

export default function TransferOwnershipModal({
    show,
    onClose,
    onConfirm,
    targetMember,
    memberEmail,
    roles,
    selectedDowngradeRoleId,
    onRoleChange,
    isPending
}: Readonly<TransferOwnershipModalProps>) {
    const { t } = useTranslation();
    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('TransferWorkspaceOwnership')}</h5>
                            <button type="button" className="btn-close" aria-label="Close"
                                    onClick={onClose}/>
                        </div>
                        <div className="modal-body">
                            <p className="mb-2">
                                {t('RoleForOldOwner')}: <span
                                className="font-monospace">{memberEmail || targetMember?.userId}</span>
                            </p>
                            <div className="mb-3">
                                <label htmlFor="roleSelect" className="form-label">{t('RoleForOldOwner')}</label>
                                <select
                                    id="roleSelect"
                                    className="form-select"
                                    value={selectedDowngradeRoleId === '' ? '' : String(selectedDowngradeRoleId)}
                                    onChange={(e) =>
                                        onRoleChange(e.target.value ? Number(e.target.value) : '')
                                    }
                                >
                                    <option value="">{t('SelectRole')}</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.code}
                                            {r.name ? ` (${r.name})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="form-text">
                                    {t('PleaseSelectRoleForOldOwner')}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}
                                    disabled={isPending}>
                                {t('Close')}
                            </button>
                            <button className="btn btn-primary" onClick={onConfirm}
                                    disabled={isPending}>
                                {isPending ? t('Saving') : t('TransferOwnership')}
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


