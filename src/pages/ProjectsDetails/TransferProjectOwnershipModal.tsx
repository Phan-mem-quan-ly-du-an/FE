import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectRole } from '../../apiCaller/projectRoles';

interface TransferProjectOwnershipModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetMember: {
        userId: string;
        email?: string;
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
    const { t } = useTranslation();
    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('TransferProjectOwnership')}</h5>
                            <button type="button" className="btn-close" aria-label={t('Close')}
                                    onClick={onClose}/>
                        </div>
                        <div className="modal-body">
                            <p className="mb-2">
                                {t('TransferOwnershipTo')} <span>{targetMember?.email || targetMember?.userId}</span>
                            </p>
                            <div className="mb-3">
                                <label className="form-label">{t('NewRoleForFormerOwner')}</label>
                                <select
                                    className="form-select"
                                    value={selectedDowngradeRoleId === '' ? '' : String(selectedDowngradeRoleId)}
                                    onChange={(e) =>
                                        onRoleChange(e.target.value ? Number(e.target.value) : '')
                                    }
                                >
                                    <option value="">{t('SelectRolePlaceholder')}</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name || r.code}
                                        </option>
                                    ))}
                                </select>
                                <div className="form-text">
                                    {t('MustSelectRoleForFormerOwner')}
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