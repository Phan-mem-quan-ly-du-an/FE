import React from 'react';
import DeleteModal from "../../Components/Common/DeleteModal";
import { toast } from 'react-toastify';
import { deleteWorkspace, Workspace } from '../../apiCaller/workspaces';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace | null;
    companyId: string;
    onSuccess: () => void;
}

const ConfirmDeleteWorkspaceModal: React.FC<ConfirmDeleteWorkspaceModalProps> = ({ isOpen, onClose, workspace, companyId, onSuccess }) => {
    const { t } = useTranslation();
    
    const handleDeleteConfirm = async () => {
        if (companyId && workspace) {
            try {
                await deleteWorkspace(companyId, workspace.id);
                toast.success(t('t-workspace-toast-delete-success'));
                onClose();
                onSuccess();
            } catch (error) {
                toast.error(t('t-workspace-toast-delete-error'));
            }
        }
    };

    return (
        <DeleteModal
            show={isOpen}
            onDeleteClick={handleDeleteConfirm}
            onCloseClick={onClose}
        />
    );
};

export default ConfirmDeleteWorkspaceModal;