import React from 'react';
import { useTranslation } from 'react-i18next';
import {Role, CompanyMember} from '../../apiCaller/companyMembers';

interface TransferOwnershipModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetMember: CompanyMember | null;
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
    const { t } = useTranslation();
    
    if (!show) return null;

    const memberEmail = targetMember?.email ?? targetMember?.invitedEmail ?? targetMember?.userId ?? '';

    return (
        <>
            <div className="modal d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('TransferOwnership')}</h5>
                            <button type="button" className="btn-close" aria-label="Close"
                                    onClick={onClose}/>
                        </div>
                        <div className="modal-body">
                            <p className="mb-2">
                                {t('TransferOwnershipTo')}: <span
                                className="font-monospace">{memberEmail}</span>
                            </p>
                            <div className="mb-3">
                                <label className="form-label">{t('RoleForCurrentOwner')}</label>
                                <select
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
                                    {t('SelectRoleForOldOwnerMessage')}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}
                                    disabled={isPending}>
                                {t('Cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={onConfirm}
                                    disabled={isPending}>
                                {isPending ? t('Transferring') : t('ConfirmTransfer')}
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
