import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Input, Label, Form, FormFeedback } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createProject, CreateProjectRequest } from '../../apiCaller/projects';
import { getWorkspacesByCompanyIdParams, Workspace } from '../../apiCaller/workspaces';
import { useTranslation } from 'react-i18next';

function friendlyNetworkMessage(msg?: string, t?: (key: string) => string) {
    const s = (msg || '').toLowerCase();
    if (s.includes('500') || s.includes('failed to fetch') || s.includes('network')) {
        return t ? t('NetworkError') : 'Network error. Please reload.';
    }
    return msg || (t ? t('UnexpectedError') : 'An error occurred.');
}

export default function CreateProjectModal({
                                               open, onClose, onCreated
                                           }: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const { t } = useTranslation();
    const { companyId } = useParams<{ companyId: string }>();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
    const [msg, setMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Fetch workspaces
    const { data: workspaces = [], isLoading: loadingWorkspaces, error: workspacesError } = useQuery<Workspace[]>({
        queryKey: ['workspaces', companyId],
        queryFn: () => getWorkspacesByCompanyIdParams({ companyId }),
        enabled: !!companyId && open,
    });

    const colorOptions = [
        { value: '#3b82f6', label: t('ColorBlue') },
        { value: '#10b981', label: t('ColorGreen') },
        { value: '#f59e0b', label: t('ColorOrange') },
        { value: '#ef4444', label: t('ColorRed') },
        { value: '#8b5cf6', label: t('ColorPurple') },
        { value: '#06b6d4', label: t('ColorCyan') },
        { value: '#84cc16', label: t('ColorLime') },
        { value: '#f97316', label: t('ColorOrange2') },
        { value: '#ec4899', label: t('ColorPink') },
        { value: '#6b7280', label: t('ColorGray') },
    ];

    useEffect(() => {
        if (!open) return;
        setName('');
        setDescription('');
        setColor('#3b82f6');
        setSelectedWorkspaceId('');
        setMsg(null);
        setSaving(false);
    }, [open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setMsg(t('ProjectNameRequired'));
            return;
        }
        if (!selectedWorkspaceId) {
            setMsg(t('SelectWorkspaceRequired'));
            return;
        }

        setSaving(true);
        setMsg(null);

        try {
            const payload: CreateProjectRequest = {
                name: name.trim(),
                description: description.trim() || undefined,
                color: color
            };

            await createProject(selectedWorkspaceId, payload);
            onCreated();
            onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message, t));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>{t('CreateProject')}</ModalHeader>
            <ModalBody>
                <style>{`
                    .modal-compact .modal-dialog { max-width: 520px; }
                    .modal-compact .modal-content { border-radius: 14px; }
                    .color-option {
                        width: 32px; height: 32px;
                        border-radius: 50%; border: 2px solid transparent;
                        cursor: pointer; display: inline-block; margin: 2px;
                        transition: all 0.2s ease;
                    }
                    .color-option:hover { transform: scale(1.1); }
                    .color-option.selected { border-color: #000; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); }
                `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="d-flex flex-column gap-3">
                    {/* Workspace */}
                    <div>
                        <Label className="form-label">
                            {t('Workspace')} <span className="text-danger">*</span>
                        </Label>
                        <Input
                            type="select"
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            required
                            disabled={saving || loadingWorkspaces}
                        >
                            <option value="">{t('SelectWorkspacePlaceholder')}</option>
                            {workspaces.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                </option>
                            ))}
                        </Input>
                        {loadingWorkspaces && <div className="form-text">{t('LoadingWorkspaces')}</div>}
                        {workspacesError && <div className="form-text text-danger">{t('ErrorLoadingWorkspaces')}</div>}
                        {!loadingWorkspaces && workspaces.length === 0 && (
                            <div className="form-text text-warning">{t('NoWorkspacesFound')}</div>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <Label className="form-label">
                            {t('ProjectName')} <span className="text-danger">*</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder={t('ProjectNamePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={saving}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="form-label">{t('Description')}</Label>
                        <Input
                            type="textarea"
                            placeholder={t('DescriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                            rows={3}
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <Label className="form-label">{t('Color')}</Label>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {colorOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`color-option ${color === option.value ? 'selected' : ''}`}
                                    style={{ backgroundColor: option.value }}
                                    onClick={() => setColor(option.value)}
                                    title={option.label}
                                />
                            ))}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                disabled={saving}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '50%' }}
                            />
                            <span className="text-muted small">{t('CustomColor')}</span>
                        </div>
                    </div>

                    <div className="d-grid gap-2 mt-2">
                        <Button
                            type="submit"
                            color="primary"
                            disabled={saving || !name.trim() || !selectedWorkspaceId}
                        >
                            {saving ? t('CreatingProject') : t('CreateProject')}
                        </Button>
                        <Button
                            type="button"
                            color="light"
                            onClick={onClose}
                            disabled={saving}
                        >
                            {t('Cancel')}
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}
