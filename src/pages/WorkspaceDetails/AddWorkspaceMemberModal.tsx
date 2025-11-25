import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Button, Input, Row, Col, FormFeedback, Label } from 'reactstrap';
import { getCompanyMembers, CompanyMember } from '../../apiCaller/companyMembers';
import { getWorkspaceRoles, WorkspaceRole } from '../../apiCaller/workspaceRoles';
import { addWorkspaceMember } from '../../apiCaller/workspaceDetails';

type Props = {
    show: boolean;
    onClose: () => void;
    workspaceId: string;
    companyId: string;
    onSuccess?: () => void;
};

type Entry = {
    email: string;
    userId?: string;
    roleId?: number;
    error?: string | null;
};

const AddWorkspaceMemberModal: React.FC<Props> = ({ show, onClose, workspaceId, companyId, onSuccess }) => {
    const { t } = useTranslation();
    const [emailsText, setEmailsText] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [roles, setRoles] = useState<WorkspaceRole[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) return;
        (async () => {
            try {
                const [cm, rs] = await Promise.all([
                    getCompanyMembers(companyId),
                    getWorkspaceRoles(workspaceId),
                ]);
                setMembers(cm || []);
                setRoles(rs || []);
            } catch (e) {
                console.error('Error loading members and roles:', e);
            }
        })();
    }, [show, companyId, workspaceId]);

    useEffect(() => {
        const rows = emailsText
            .split(/\r?\n/) 
            .map(s => s.trim())
            .filter(Boolean);
        const unique = Array.from(new Set(rows));
        const resolved: Entry[] = unique.map(email => {
            const match = members.find(m => (m.invitedEmail || '').toLowerCase() === email.toLowerCase());
            return {
                email,
                userId: match?.userId,
                roleId: undefined,
                error: match ? null : t('EmailNotFoundInCompany'),
            };
        });
        setEntries(resolved);
    }, [emailsText, members]);

    const canSubmit = useMemo(() => {
        if (entries.length === 0) return false;
        return entries.every(e => !!e.userId && !!e.roleId && !e.error);
    }, [entries]);

    const handleRoleChange = (idx: number, value: string) => {
        const v = value ? Number(value) : undefined;
        setEntries(prev => prev.map((x, i) => i === idx ? { ...x, roleId: v } : x));
    };

    const handleRemoveEntry = (idx: number) => {
        setEntries(prev => prev.filter((_, i) => i !== idx));
    };

    async function handleInvite() {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            for (const e of entries) {
                if (!e.userId || !e.roleId) continue;
                await addWorkspaceMember(workspaceId, { userId: e.userId, roleId: e.roleId });
            }
            onSuccess?.();
            onClose();
            setEmailsText('');
        } catch (err) {
            console.error('Error inviting members:', err);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal isOpen={show} toggle={onClose} centered size="lg">
            <ModalHeader toggle={onClose}>{t('InviteMembersTitle')}</ModalHeader>
            <ModalBody>
                <Row className="g-3">
                    <Col md={12}>
                        <Label className="form-label">{t('EnterEmailAddresses')}</Label>
                        <Input
                            type="textarea"
                            rows={5}
                            value={emailsText}
                            onChange={(e) => setEmailsText(e.target.value)}
                            placeholder="name@example.com\nother@example.com"
                        />
                        <div className="form-text">{t('EnterEmailAddressesOnePerLine')}</div>
                    </Col>
                    <Col md={12}>
                        <Label className="form-label">{t('AssignRolePerEmail')}</Label>
                        <div className="table-responsive table-card">
                            <table className="table align-middle table-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ inlineSize: '45%' }}>{t('WorkspaceMemberEmail')}</th>
                                        <th style={{ inlineSize: '35%' }}>{t('MemberRole')}</th>
                                        <th style={{ inlineSize: '20%' }} />
                                    </tr>
                                </thead>
                                <tbody>
                                {entries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center text-muted">{t('NoEmailsEntered')}</td>
                                    </tr>
                                )}
                                {entries.map((e, idx) => (
                                    <tr key={e.email + entries.length}>
                                        <td>
                                            <div>{e.email}</div>
                                            {e.error && <FormFeedback className="d-block">{e.error}</FormFeedback>}
                                        </td>
                                        <td>
                                            <select
                                                className="form-select"
                                                value={e.roleId ?? ''}
                                                onChange={(ev) => handleRoleChange(idx, ev.target.value)}
                                            >
                                                <option value="">{t('SelectWorkspaceRole')}</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name || r.code}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-end">
                                            <Button color="light" size="sm" onClick={() => handleRemoveEntry(idx)}>{t('Remove')}</Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Col>
                    <Col md={12} className="d-flex justify-content-end gap-2">
                        <Button color="secondary" onClick={onClose} disabled={submitting}>{t('Cancel')}</Button>
                        <Button color="primary" onClick={handleInvite} disabled={!canSubmit || submitting}>{submitting ? t('Inviting') : t('InviteMembersButton')}</Button>
                    </Col>
                </Row>
            </ModalBody>
        </Modal>
    );
};

export default AddWorkspaceMemberModal;



