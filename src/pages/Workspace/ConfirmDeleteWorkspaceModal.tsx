import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { toast } from 'react-toastify';
import { deleteWorkspace, Workspace } from '../../apiCaller/workspaces';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { isForbiddenError } from '../../helpers/permissions';

interface ConfirmDeleteWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace | null;
    companyId: string;
    onSuccess: () => void;
}

const ConfirmDeleteWorkspaceModal: React.FC<ConfirmDeleteWorkspaceModalProps> = ({ isOpen, onClose, workspace, companyId, onSuccess }) => {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDeleteConfirm = async () => {
        if (companyId && workspace) {
            setIsDeleting(true);
            try {
                await deleteWorkspace(companyId, workspace.id);
                toast.success(t('t-workspace-toast-delete-success'));
                onClose();
                onSuccess();
            } catch (error) {
                const isForbidden = (error instanceof AxiosError && error.response?.status === 403) || isForbiddenError(error);
                if (isForbidden) {
                    toast.warning(t('WorkspacePermissions.DeleteWorkspaceDenied') || t('t-workspace-toast-delete-error'));
                } else {
                    toast.error(t('t-workspace-toast-delete-error'));
                }
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered>
            <ModalHeader toggle={onClose}>{t('t-workspace-delete-modal-title')}</ModalHeader>
            <ModalBody>
                <div className="text-center">
                    <div className="fs-15">
                        <i className="ri-delete-bin-line fs-1 text-danger"></i>
                        <p className="mt-3">
                            {t('t-workspace-delete-modal-body', { name: workspace?.name || '' })}
                        </p>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={onClose} disabled={isDeleting}>
                    {t('t-workspace-delete-modal-cancel-btn')}
                </Button>
                <Button color="danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
                    {isDeleting ? t('t-workspace-delete-modal-deleting-btn') : t('t-workspace-delete-modal-confirm-btn')}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmDeleteWorkspaceModal;