import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Input, Label, Form, FormFeedback } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { updateProject, Project } from '../../apiCaller/projects';


function friendlyNetworkMessage(msg?: string, t?: any) {
    const s = (msg || '').toLowerCase();
    if (s.includes('500') || s.includes('failed to fetch') || s.includes('network')) {
        return t ? t('NetworkError') : 'Network error. Please reload.';
    }
    return msg || (t ? t('UnexpectedError') : 'An error occurred.');
}

export default function EditProjectModal({
    open, onClose, onUpdated, project
}: { 
    open: boolean; 
    onClose: () => void; 
    onUpdated: () => void;
    project: Project | null;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [msg, setMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (project && open) {
            setName(project.name || '');
            setDescription(project.description || '');
            setColor(project.color || '#3b82f6');
            setMsg(null);
            setSaving(false);
        }
    }, [project, open]);

    useEffect(() => {
        if (!open) {
            setName('');
            setDescription('');
            setColor('#3b82f6');
            setMsg(null);
            setSaving(false);
        }
    }, [open]);
    
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setMsg(t('ProjectNameRequired'));
            return;
        }
        if (!project?.id) {
            setMsg(t('ProjectIDMissing'));
            return;
        }

        setSaving(true);
        setMsg(null);

        try {
            await updateProject(project.id, {
                name: name.trim(),
                description: description.trim(),
                color
            });

            onUpdated();
            onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message, t));
        } finally {
            setSaving(false);
        }
    }

    if (!project) {
        return null;
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>{t('EditProject')}</ModalHeader>
            <ModalBody>
                <style>{`
                    .modal-compact .modal-dialog { max-width: 520px; }
                    .modal-compact .modal-content { border-radius: 14px; }
                `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="d-flex flex-column gap-3">
                    <div>
                        <Label className="form-label">{t('ProjectName')} <span className="text-danger">*</span></Label>
                        <Input 
                            type="text" 
                            placeholder={t('ProjectNamePlaceholder')}
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            disabled={saving} 
                            invalid={!name.trim() && !!name}
                        />
                        {!name.trim() && !!name && <FormFeedback>{t('ProjectNameRequired')}</FormFeedback>}
                    </div>
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

                    <div>
                        <Label className="form-label">{t('Color')}</Label>
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            disabled={saving}
                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '50%' }}
                        />
                    </div>


                    <div className="d-grid gap-2 mt-2">
                        <Button 
                            type="submit" 
                            color="primary" 
                            disabled={saving || !name.trim()}
                        >
                            {saving ? t('Saving') : t('Save')}
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
