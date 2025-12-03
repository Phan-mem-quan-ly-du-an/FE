import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Input, Label, Form, FormFeedback } from 'reactstrap';
import { uploadImageTo } from 'lib/uploader';

export type Company = { id: string; name: string; logoUrl?: string | null };

function toAbsUrl(u?: string | null, base?: string) {
    try { if (!u) return ''; return new URL(u, base).toString(); } catch { return ''; }
}
function toRelPath(u?: string | null, base?: string) {
    try { if (!u) return ''; return new URL(u, base).pathname; }
    catch { if (!u) return ''; return u.startsWith('/') ? u : `/${u}`; }
}
function friendlyNetworkMessage(msg?: string) {
    const s = (msg || '').toLowerCase();
    if (s.includes('403')) return 'Bạn không có quyền này';
    if (s.includes('500') || s.includes('failed to fetch') || s.includes('network')) {
        return 'Network error. Please reload.';
    }
    return msg || 'An error occurred.';
}

export default function EditCompanyModal({
                                             open, onClose, company, onSaved,
                                         }: { open: boolean; onClose: () => void; company: Company | null; onSaved: () => void }) {
    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;
    const token = (window as any).__access_token__ || localStorage.getItem('access_token') || '';

    const [name, setName] = useState('');
    const [logoRel, setLogoRel] = useState('');
    const [logoPreview, setLogoPreview] = useState('');
    const [msg, setMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastBlobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) return;
        if (company) {
            setName(company.name || '');
            const rel = company.logoUrl || '';
            setLogoRel(toRelPath(rel, base));
            setLogoPreview(toAbsUrl(rel, base));
        }
        setMsg(null); setSaving(false); setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (lastBlobUrlRef.current?.startsWith('blob:')) { URL.revokeObjectURL(lastBlobUrlRef.current); lastBlobUrlRef.current = null; }
        return () => { if (lastBlobUrlRef.current?.startsWith('blob:')) { URL.revokeObjectURL(lastBlobUrlRef.current); lastBlobUrlRef.current = null; } };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, company?.id]);

    async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.currentTarget;
        const f = input.files?.[0]; if (!f) return;

        const blobUrl = URL.createObjectURL(f);
        if (lastBlobUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = blobUrl; setLogoPreview(blobUrl);

        setUploading(true); setMsg(null);
        try {
            const res = await uploadImageTo('company-logo', f, token, base);
            const abs = toAbsUrl(res?.url, base); const rel = toRelPath(res?.url, base);
            if (abs) setLogoPreview(abs); if (rel) setLogoRel(rel);
            if (lastBlobUrlRef.current?.startsWith('blob:')) { URL.revokeObjectURL(lastBlobUrlRef.current); lastBlobUrlRef.current = null; }
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message));
        } finally { setUploading(false); if (input) input.value = ''; }
    }

    function handleRemoveLogo() {
        if (lastBlobUrlRef.current?.startsWith('blob:')) { URL.revokeObjectURL(lastBlobUrlRef.current); lastBlobUrlRef.current = null; }
        setLogoPreview(''); setLogoRel(''); if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;
        if (!name.trim()) { setMsg('Company name is required.'); return; }
        setSaving(true); setMsg(null);
        try {
            const res = await fetch(new URL(`api/companies/${company.id}`, base).toString(), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
                body: JSON.stringify({ name: name.trim(), logoUrl: logoRel || undefined }),
            });
            if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
            onSaved(); onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message));
        } finally { setSaving(false); }
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Edit Company</ModalHeader>
            <ModalBody>
                <style>{`
          .modal-compact .modal-dialog { max-width: 620px; }
          .modal-compact .modal-content { border-radius: 14px; }
          .avatar-circle-lg { width: 96px; height: 96px; border-radius: 50%; overflow: hidden;
            background:#f8f9fa; display:flex; align-items:center; justify-content:center;
            border:1px solid rgba(0,0,0,.08); margin: 0 auto 10px; font-size:12px; color:#6c757d;}
          .avatar-circle-lg img { width:100%; height:100%; object-fit:cover; }
        `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="d-flex flex-column gap-3">
                    <div className="avatar-circle-lg">{logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>Logo</span>}</div>

                    <div className="text-center">
                        <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleLogoChange} disabled={uploading || saving}/>
                        <Button type="button" color="secondary" outline onClick={() => fileInputRef.current?.click()} disabled={uploading || saving}>
                            {uploading ? 'Uploading...' : 'Choose Image'}
                        </Button>
                        {logoPreview && (
                            <Button type="button" color="link" className="text-danger px-2" onClick={handleRemoveLogo} disabled={saving || uploading}>
                                Remove
                            </Button>
                        )}
                        <div className="form-text mt-1">Square ≥ 320×320 for best circular avatar.</div>
                    </div>

                    <div>
                        <Label className="form-label">Company Name <span className="text-danger">*</span></Label>
                        <Input type="text" placeholder="e.g., Acme Corporation" value={name} onChange={(e)=>setName(e.target.value)} required disabled={saving} invalid={!name.trim() && !!name}/>
                        {!name.trim() && !!name && <FormFeedback>Company name is required.</FormFeedback>}
                    </div>

                    <div className="d-grid gap-2 mt-2">
                        <Button type="submit" color="primary" disabled={saving || uploading || !name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
                        <Button type="button" color="light" onClick={onClose} disabled={saving}>Cancel</Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}
