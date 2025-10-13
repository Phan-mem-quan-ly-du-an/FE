import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalHeader } from "reactstrap";

export type ConfirmDeleteRoleModalProps = {
    show: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    roleName: string;
    isDeleting?: boolean;
};

export default function ConfirmDeleteRoleModal({ show, onClose, onConfirm, roleName, isDeleting }: ConfirmDeleteRoleModalProps) {
    const { t } = useTranslation();
    return (
        <Modal isOpen={show} toggle={onClose} centered>
            <ModalHeader toggle={onClose}>{t('ConfirmDelete')}</ModalHeader>
            <ModalBody>
                <p className="mb-4">{t('ConfirmDeleteRoleMessage', { name: roleName })}</p>
                <div className="d-flex justify-content-end gap-2">
                    <Button type="button" color="secondary" onClick={onClose} disabled={isDeleting}>{t('Cancel')}</Button>
                    <Button type="button" color="danger" onClick={() => onConfirm()} disabled={isDeleting}>{isDeleting ? t('Deleting') : t('Delete')}</Button>
                </div>
            </ModalBody>
        </Modal>
    );
}


