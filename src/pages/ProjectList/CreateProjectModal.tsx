import React, { useEffect, useState, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Input, Label, Form, FormFeedback } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createProject, CreateProjectRequest } from '../../apiCaller/projects';
import { getWorkspacesByCompanyIdParams, Workspace } from '../../apiCaller/workspaces';

function friendlyNetworkMessage(msg?: string) {
    const s = (msg || '').toLowerCase();
    return (s.includes('500') || s.includes('failed to fetch') || s.includes('network'))
        ? 'Network error. Please reload.'
        : (msg || 'An error occurred.');
}

export default function CreateProjectModal({
    open, onClose, onCreated
}: { 
    open: boolean; 
    onClose: () => void; 
    onCreated: () => void;
}) {
    const { companyId } = useParams<{companyId: string}>();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3b82f6'); // Default blue color
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
    const [msg, setMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Fetch workspaces for the current company
    const { data: workspaces = [], isLoading: loadingWorkspaces, error: workspacesError } = useQuery<Workspace[]>({
        queryKey: ['workspaces', companyId],
        queryFn: () => getWorkspacesByCompanyIdParams({ companyId }),
        enabled: !!companyId && open,
    });

    // Predefined color options
    const colorOptions = [
        { value: '#3b82f6', label: 'Blue', class: 'bg-primary' },
        { value: '#10b981', label: 'Green', class: 'bg-success' },
        { value: '#f59e0b', label: 'Orange', class: 'bg-warning' },
        { value: '#ef4444', label: 'Red', class: 'bg-danger' },
        { value: '#8b5cf6', label: 'Purple', class: 'bg-purple' },
        { value: '#06b6d4', label: 'Cyan', class: 'bg-info' },
        { value: '#84cc16', label: 'Lime', class: 'bg-success' },
        { value: '#f97316', label: 'Orange', class: 'bg-warning' },
        { value: '#ec4899', label: 'Pink', class: 'bg-pink' },
        { value: '#6b7280', label: 'Gray', class: 'bg-secondary' },
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
            setMsg('Project name is required.'); 
            return; 
        }
        if (!selectedWorkspaceId) { 
            setMsg('Please select a workspace.'); 
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
            setMsg(friendlyNetworkMessage(err?.message));
        } finally { 
            setSaving(false); 
        }
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Create Project</ModalHeader>
            <ModalBody>
                <style>{`
                    .modal-compact .modal-dialog { max-width: 520px; }
                    .modal-compact .modal-content { border-radius: 14px; }
                    .color-option {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        border: 2px solid transparent;
                        cursor: pointer;
                        display: inline-block;
                        margin: 2px;
                        transition: all 0.2s ease;
                    }
                    .color-option:hover {
                        transform: scale(1.1);
                    }
                    .color-option.selected {
                        border-color: #000;
                        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
                    }
                `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="d-flex flex-column gap-3">
                    <div>
                        <Label className="form-label">Workspace <span className="text-danger">*</span></Label>
                        <Input 
                            type="select" 
                            value={selectedWorkspaceId} 
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)} 
                            required 
                            disabled={saving || loadingWorkspaces}
                            invalid={!selectedWorkspaceId && !!selectedWorkspaceId}
                        >
                            <option value="">Select a workspace...</option>
                            {workspaces.map((workspace) => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                </option>
                            ))}
                        </Input>
                        {!selectedWorkspaceId && !!selectedWorkspaceId && <FormFeedback>Please select a workspace.</FormFeedback>}
                        {loadingWorkspaces && <div className="form-text">Loading workspaces...</div>}
                        {workspacesError && <div className="form-text text-danger">Error loading workspaces: {workspacesError.message}</div>}
                        {!loadingWorkspaces && workspaces.length === 0 && <div className="form-text text-warning">No workspaces found for this company.</div>}
                    </div>

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

                    <div>
                        <Label className="form-label">Description</Label>
                        <Input 
                            type="textarea" 
                            placeholder="Brief description of the project..."
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            disabled={saving}
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="form-label">Color</Label>
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
                            <span className="text-muted small">Custom color</span>
                        </div>
                    </div>

                    <div className="d-grid gap-2 mt-2">
                        <Button 
                            type="submit" 
                            color="primary" 
                            disabled={saving || !name.trim() || !selectedWorkspaceId}
                        >
                            {saving ? 'Creating...' : 'Create Project'}
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
