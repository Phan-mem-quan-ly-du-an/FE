import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Input, Label, Form, FormFeedback } from 'reactstrap';
import { renameProject, RenameProjectRequest, Project } from '../../apiCaller/projects';

function friendlyNetworkMessage(msg?: string) {
    const s = (msg || '').toLowerCase();
    return (s.includes('500') || s.includes('failed to fetch') || s.includes('network'))
        ? 'Network error. Please reload.'
        : (msg || 'An error occurred.');
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
    const [msg, setMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (project && open) {
            setName(project.name || '');
            setMsg(null);
            setSaving(false);
        }
    }, [project, open]);

    useEffect(() => {
        if (!open) {
            setName('');
            setMsg(null);
            setSaving(false);
        }
    }, [open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { 
            setMsg('Project name is required.'); 
            return; 
        }
        if (!project?.id) {
            setMsg('Project ID is missing.');
            return;
        }
        
        setSaving(true); 
        setMsg(null);
        
        try {
            const payload: RenameProjectRequest = {
                name: name.trim()
            };
            
            await renameProject(project.id, payload);
            onUpdated(); 
            onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message));
        } finally { 
            setSaving(false); 
        }
    }

    if (!project) {
        return null;
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Edit Project</ModalHeader>
            <ModalBody>
                <style>{`
                    .modal-compact .modal-dialog { max-width: 520px; }
                    .modal-compact .modal-content { border-radius: 14px; }
                `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="d-flex flex-column gap-3">
                    <div>
                        <Label className="form-label">Project Name <span className="text-danger">*</span></Label>
                        <Input 
                            type="text" 
                            placeholder="e.g., Website Redesign" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            disabled={saving} 
                            invalid={!name.trim() && !!name}
                        />
                        {!name.trim() && !!name && <FormFeedback>Project name is required.</FormFeedback>}
                    </div>

                    <div className="d-grid gap-2 mt-2">
                        <Button 
                            type="submit" 
                            color="primary" 
                            disabled={saving || !name.trim()}
                        >
                            {saving ? 'Updating...' : 'Rename Project'}
                        </Button>
                        <Button 
                            type="button" 
                            color="light" 
                            onClick={onClose} 
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}
