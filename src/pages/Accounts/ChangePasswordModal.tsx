import React, { useMemo, useState } from "react";
import { Modal, ModalHeader, ModalBody, Button, Form, Label, Input, InputGroup, InputGroupText } from "reactstrap";
import FeatherIcon from "feather-icons-react";
import { changePassword } from "helpers/account/changePassword";

type Props = {
    open: boolean;
    onClose: () => void;
    accessToken?: string | null;
    onChanged?: (msg?: string) => void;
};

function friendlyNetworkMessage(msg?: string) {
    const s = (msg || "").toLowerCase();
    return (s.includes("500") || s.includes("failed to fetch") || s.includes("network"))
        ? "Network error. Please reload."
        : (msg || "An error occurred.");
}

const rules = {
    length: (s: string) => s.length >= 8,
    upper: (s: string) => /[A-Z]/.test(s),
    lower: (s: string) => /[a-z]/.test(s),
    number: (s: string) => /[0-9]/.test(s),
    special: (s: string) => /[^A-Za-z0-9]/.test(s),
};

function scorePassword(pwd: string) {
    let score = 0;
    if (rules.length(pwd)) score++;
    if (rules.upper(pwd)) score++;
    if (rules.lower(pwd)) score++;
    if (rules.number(pwd)) score++;
    if (rules.special(pwd)) score++;
    return score; // 0..5
}

export default function ChangePasswordModal({ open, onClose, accessToken, onChanged }: Props) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showCon, setShowCon] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const s = useMemo(() => scorePassword(newPassword), [newPassword]);
    const allPass = useMemo(
        () => rules.length(newPassword) && rules.upper(newPassword) && rules.lower(newPassword) && rules.number(newPassword) && rules.special(newPassword),
        [newPassword]
    );

    const canSubmit = !!accessToken && !!currentPassword && !!newPassword && newPassword === confirmPassword && allPass && !busy;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);

        if (!accessToken) {
            setMsg("Missing access token. Please sign in again.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setMsg("New password and confirmation do not match.");
            return;
        }
        if (!allPass) {
            setMsg("Please meet all password requirements.");
            return;
        }
        try {
            setBusy(true);
            await changePassword(accessToken, currentPassword, newPassword);
            setMsg("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onChanged?.("Password changed successfully.");
            onClose();
        } catch (err: any) {
            setMsg(friendlyNetworkMessage(err?.message));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal isOpen={open} toggle={onClose} centered modalClassName="modal-compact">
            <ModalHeader toggle={onClose}>Change password</ModalHeader>
            <ModalBody>
                <style>{`
          .modal-compact .modal-dialog { max-width: 680px; }
          .modal-compact .modal-content { border-radius: 16px; }
          .req-list { list-style: none; padding-left: 0; margin: 0; }
          .req-list li { display:flex; align-items:center; gap:8px; font-size: .92rem; }
          .req-ok { color: #198754; }  /* green */
          .req-bad { color: #adb5bd; }
          .meter { display:flex; gap:6px; margin: 6px 0 10px; }
          .meter .bar { flex:1; height: 8px; border-radius: 6px; background:#e9ecef; }
          .meter .bar.on-1 { background:#dc3545; }  /* red */
          .meter .bar.on-2 { background:#fd7e14; }  /* orange */
          .meter .bar.on-3 { background:#f7c32e; }  /* yellow */
          .meter .bar.on-4 { background:#20c997; }  /* teal */
          .meter .bar.on-5 { background:#198754; }  /* green */
          .hint { font-size: .85rem; color:#6c757d; }
        `}</style>

                {msg && <div className="alert alert-warning py-2">{msg}</div>}

                <Form onSubmit={onSubmit} className="row g-3">
                    {/* Current password */}
                    <div className="col-12">
                        <Label className="form-label">Current password</Label>
                        <InputGroup>
                            <Input
                                type={showCur ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={busy}
                            />
                            <InputGroupText style={{ cursor: "pointer" }} onClick={() => setShowCur(v => !v)} title={showCur ? "Hide" : "Show"}>
                                <FeatherIcon icon={showCur ? "eye-off" : "eye"} size={16}/>
                            </InputGroupText>
                        </InputGroup>
                    </div>

                    {/* New password */}
                    <div className="col-12">
                        <Label className="form-label">New password</Label>
                        <InputGroup>
                            <Input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={busy}
                            />
                            <InputGroupText style={{ cursor: "pointer" }} onClick={() => setShowNew(v => !v)} title={showNew ? "Hide" : "Show"}>
                                <FeatherIcon icon={showNew ? "eye-off" : "eye"} size={16}/>
                            </InputGroupText>
                        </InputGroup>

                        {/* Strength meter (5 bars) */}
                        <div className="meter">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className={`bar ${s >= i ? `on-${s}` : ""}`}></div>
                            ))}
                        </div>

                        {/* Requirements checklist */}
                        <ul className="req-list">
                            <li className={rules.length(newPassword) ? "req-ok" : "req-bad"}>
                                <FeatherIcon icon={rules.length(newPassword) ? "check-circle" : "circle"} size={14}/> At least 8 characters
                            </li>
                            <li className={rules.upper(newPassword) ? "req-ok" : "req-bad"}>
                                <FeatherIcon icon={rules.upper(newPassword) ? "check-circle" : "circle"} size={14}/> Uppercase letter (A–Z)
                            </li>
                            <li className={rules.lower(newPassword) ? "req-ok" : "req-bad"}>
                                <FeatherIcon icon={rules.lower(newPassword) ? "check-circle" : "circle"} size={14}/> Lowercase letter (a–z)
                            </li>
                            <li className={rules.number(newPassword) ? "req-ok" : "req-bad"}>
                                <FeatherIcon icon={rules.number(newPassword) ? "check-circle" : "circle"} size={14}/> Number (0–9)
                            </li>
                            <li className={rules.special(newPassword) ? "req-ok" : "req-bad"}>
                                <FeatherIcon icon={rules.special(newPassword) ? "check-circle" : "circle"} size={14}/> Special character (!@#$…)
                            </li>
                        </ul>
                        <div className="hint mt-1">Use a unique password you don’t reuse elsewhere.</div>
                    </div>

                    {/* Confirm */}
                    <div className="col-12">
                        <Label className="form-label">Confirm new password</Label>
                        <InputGroup>
                            <Input
                                type={showCon ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={busy}
                            />
                            <InputGroupText style={{ cursor: "pointer" }} onClick={() => setShowCon(v => !v)} title={showCon ? "Hide" : "Show"}>
                                <FeatherIcon icon={showCon ? "eye-off" : "eye"} size={16}/>
                            </InputGroupText>
                        </InputGroup>
                    </div>

                    {/* Actions */}
                    <div className="col-12 d-flex justify-content-end gap-2">
                        <Button type="button" className="btn-light" onClick={onClose} disabled={busy}>Cancel</Button>
                        <Button type="submit" color="primary" disabled={!canSubmit}>
                            {busy ? "Changing..." : "Change password"}
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}
