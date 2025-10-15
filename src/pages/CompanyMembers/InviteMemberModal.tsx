import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, Button } from 'reactstrap';
import { getCompanyRoles, inviteMember, Role } from '../../apiCaller/companyMembers';

interface InviteMemberModalProps {
    show: boolean;
    onClose: () => void;
    companyId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function friendlyNetworkMessage(msg?: string) {
    const s = (msg || '').toLowerCase();
    return (s.includes('500') || s.includes('failed to fetch') || s.includes('network'))
        ? 'Network error. Please reload.'
        : (msg || 'An error occurred.');
}

export default function InviteMemberModal(props: InviteMemberModalProps) {
    const { show, onClose, companyId, onSuccess, onError } = props;
    const qc = useQueryClient();

    // Roles
    const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
        queryKey: ['company-roles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
        enabled: show && !!companyId,
    });

    const [emailsRaw, setEmailsRaw] = useState(''); // textarea content
    const [roleMap, setRoleMap] = useState<Record<string, number | ''>>({});
    const [msg, setMsg] = useState<string | null>(null);
    const defaultRoleId = roles?.[0]?.id ?? '';

    // Extract and normalize emails list from textarea
    const emails: string[] = useMemo(() => {
        const list = emailsRaw
            .split(/[\n,;]+/)
            .map(s => s.trim())
            .filter(Boolean);
        // Deduplicate while keeping order
        const seen = new Set<string>();
        const out: string[] = [];
        for (const e of list) {
            if (!seen.has(e)) { seen.add(e); out.push(e); }
        }
        return out;
    }, [emailsRaw]);

    // When emails change or roles load, ensure roleMap has defaults
    useEffect(() => {
        if (!roles || roles.length === 0) return;
        setRoleMap(prev => {
            const next: Record<string, number | ''> = { ...prev };
            for (const e of emails) {
                if (!(e in next)) next[e] = defaultRoleId;
            }
            // remove stale
            Object.keys(next).forEach(k => { if (!emails.includes(k)) delete next[k]; });
            return next;
        });
    }, [emails, roles, defaultRoleId]);

    const mutation = useMutation({
        mutationKey: ['invite-members', companyId],
        mutationFn: async () => {
            const results = await Promise.allSettled(
                emails.map(async (email) => {
                    const rid = roleMap[email];
                    await inviteMember(companyId, { email, roleId: (typeof rid === 'number' ? rid : undefined) as any });
                    return email;
                })
            );
            const ok = results.filter(r => r.status === 'fulfilled').length;
            const fail = results.length - ok;
            return { ok, fail };
        },
        onSuccess: ({ ok, fail }) => {
            const text = fail === 0
                ? `Invited ${ok} member${ok>1?'s':''} successfully.`
                : `Invited ${ok} member${ok>1?'s':''}. Failed: ${fail}.`;
            setMsg(text);
            qc.invalidateQueries({ queryKey: ['company-members', companyId] });
            onSuccess?.(text);
            // reset and close
            setEmailsRaw('');
            setRoleMap({});
            onClose();
        },
        onError: (error: any) => {
            const text = friendlyNetworkMessage(error?.message);
            setMsg(text);
            onError?.(text);
        },
    });

    function removeEmail(e: string) {
        // remove from textarea as well
        const lines = emailsRaw.split(/\n/).filter(Boolean).map(s => s.trim());
        const removed = lines.filter(x => x !== e).join('\n');
        setEmailsRaw(removed);
        setRoleMap(prev => {
            const next = { ...prev };
            delete next[e];
            return next;
        });
    }

    const allValid = emails.every(e => emailRegex.test(e));
    const canSubmit = emails.length > 0 && roles.length > 0 && allValid && !mutation.isPending;

    return (
        <Modal isOpen={show} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Add members</ModalHeader>
            <ModalBody>
                <style>{`
          .modal-compact .modal-dialog { max-width: 660px; }
          .modal-compact .modal-content { border-radius: 14px; }
          .emails-input { border-radius: 12px; }
          .per-email { border:1px solid rgba(0,0,0,.06); border-radius: 12px; background:#fff; }
          .per-email thead th { font-weight: 600; font-size: .9rem; color:#495057; }
          .per-email tbody td { vertical-align: middle; }
          .chip-invalid { color:#dc3545; font-size: .85rem; }
        `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}>
                    {/* Emails textarea */}
                    <div className="mb-3">
                        <Label className="form-label">Emails (one per line)</Label>
                        <Input
                            className="emails-input"
                            type="textarea"
                            rows={4}
                            placeholder={"alice@example.com\nbob@example.com"}
                            value={emailsRaw}
                            onChange={(e) => setEmailsRaw(e.target.value)}
                            disabled={mutation.isPending}
                        />
                        <div className="form-text">Paste or type multiple emails — one per line.</div>
                    </div>

                    {/* Per-email roles */}
                    <div className="mb-2">
                        <Label className="form-label">Assign role per email</Label>
                        <div className="table-responsive">
                            <table className="table per-email mb-0">
                                <thead>
                                <tr>
                                    <th style={{width: '55%'}}>Email</th>
                                    <th>Role</th>
                                    <th style={{width: 80}}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {emails.length === 0 ? (
                                    <tr><td colSpan={3} className="text-muted">Add at least one email above.</td></tr>
                                ) : (
                                    emails.map((e) => {
                                        const valid = emailRegex.test(e);
                                        return (
                                            <tr key={e}>
                                                <td>
                                                    <div className={!valid ? 'chip-invalid' : ''}>
                                                        {e}{!valid ? ' — invalid' : ''}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Input
                                                        type="select"
                                                        className="form-select"
                                                        value={roleMap[e] ?? ''}
                                                        disabled={rolesLoading || mutation.isPending}
                                                        onChange={(ev) => {
                                                            const v = ev.target.value;
                                                            setRoleMap(prev => ({ ...prev, [e]: v ? Number(v) : '' }));
                                                        }}
                                                    >
                                                        {roles.map(r => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.code || r.id}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                </td>
                                                <td className="text-end">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="btn-light"
                                                        onClick={() => removeEmail(e)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button type="button" className="btn-light" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" color="primary" disabled={!canSubmit}>
                            {mutation.isPending ? 'Inviting...' : `Invite ${emails.length || ''}`}
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}
