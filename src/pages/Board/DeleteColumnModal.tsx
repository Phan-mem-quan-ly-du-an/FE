import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormGroup,
    Label,
    Input,
    ListGroup,
    ListGroupItem,
    Alert,
    Spinner,
} from "reactstrap";
import { transferTasksFromColumn, deleteColumn, TaskResponse } from "../../apiCaller/boards";
import { toast } from "react-toastify";

interface Props {
    isOpen: boolean;
    toggle: () => void;
    column: any;              // column đang muốn delete
    columns: any[];           // toàn bộ columns (để chọn column mới)
    onSuccess: () => void;    // callback load lại board
}

const DeleteColumnModal: React.FC<Props> = ({
                                                isOpen,
                                                toggle,
                                                column,
                                                columns,
                                                onSuccess,
                                            }) => {
    const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTargetColumnId(null);
            setError(null);
        }
    }, [isOpen]);

    if (!column) return null;

    const tasks = column.tasks ?? [];
    const otherColumns = columns.filter((c) => c.id !== column.id);
    const hasTasks = tasks.length > 0;
    const projectId: string | undefined = hasTasks ? tasks[0].projectId : undefined;

    const handleConfirm = async () => {
        // Validation
        if (hasTasks && !targetColumnId) {
            setError("Please select a column to move tasks to.");
            return;
        }

        if (hasTasks && otherColumns.length === 0) {
            setError("Cannot delete this column. There are no other columns to move tasks to.");
            return;
        }

        if (hasTasks && !projectId) {
            setError("Cannot determine Project ID to move tasks. Please refresh the page.");
            return;
        }

        try {
            setIsDeleting(true);
            setError(null);

            if (hasTasks && targetColumnId && projectId) {
                console.log(`Transferring ${tasks.length} tasks from column ${column.id} to ${targetColumnId}...`);
                await transferTasksFromColumn(projectId, column.id, targetColumnId);
                toast.success(`Moved ${tasks.length} task(s) successfully`);
            }

            console.log(`Deleting column #${column.id}: ${column.name}...`);
            await deleteColumn(column.id);

            toast.success(`Column "${column.name}" deleted successfully`);
            onSuccess();
            toggle();

        } catch (err: any) {
            let errorMessage = "Failed to delete column";
            if (err.message && err.message.includes("Failed to move task")) {
                errorMessage = err.message;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle}>
            <ModalHeader toggle={toggle}>
                Delete Column: <span className="text-danger">{column.name}</span>
            </ModalHeader>

            <ModalBody>
                {/* Error Alert */}
                {error && (
                    <Alert color="danger" className="mb-3">
                        <i className="ri-error-warning-line me-2"></i>
                        {error}
                    </Alert>
                )}

                {hasTasks ? (
                    <>
                        {/* Warning about tasks */}
                        <Alert color="warning">
                            <i className="ri-alert-line me-2"></i>
                            This column contains <strong>{tasks.length} task(s)</strong>.
                            You must move them to another column before deleting.
                        </Alert>

                        {/* Check if there are other columns */}
                        {otherColumns.length === 0 ? (
                            <Alert color="danger">
                                <i className="ri-error-warning-line me-2"></i>
                                <strong>Cannot delete this column!</strong>
                                <br />
                                There are no other columns to move tasks to. Please create another column first.
                            </Alert>
                        ) : (
                            <>
                                {/* Column selector */}
                                <FormGroup>
                                    <Label>
                                        <i className="ri-arrow-right-line me-2"></i>
                                        Move all tasks to:
                                    </Label>
                                    <Input
                                        type="select"
                                        value={targetColumnId ?? ""}
                                        onChange={(e) => {
                                            setTargetColumnId(Number(e.target.value));
                                            setError(null);
                                        }}
                                        disabled={isDeleting}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {otherColumns.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.tasks?.length || 0} tasks)
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>

                                {/* List of tasks to move */}
                                <div className="mt-3">
                                    <Label className="fw-bold">
                                        <i className="ri-list-check me-2"></i>
                                        Tasks to be moved ({tasks.length}):
                                    </Label>
                                    <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {tasks.map((task: TaskResponse) => (
                                            <ListGroupItem key={task.id} className="py-2">
                                                <div className="d-flex align-items-center">
                                                    <i className="ri-drag-move-line me-2 text-muted"></i>
                                                    <span className="flex-grow-1">{task.title}</span>
                                                    {task.priority && (
                                                        <span className={`badge bg-${
                                                            task.priority === 'HIGH' ? 'danger' :
                                                                task.priority === 'MEDIUM' ? 'warning' : 'info'
                                                        }`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                </div>
                                            </ListGroupItem>
                                        ))}
                                    </ListGroup>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <Alert color="info">
                        <i className="ri-information-line me-2"></i>
                        This column is empty and can be safely deleted.
                    </Alert>
                )}
            </ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button
                    color="danger"
                    onClick={handleConfirm}
                    disabled={
                        isDeleting ||
                        (hasTasks && (!targetColumnId || otherColumns.length === 0))
                    }
                >
                    {isDeleting ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Deleting...
                        </>
                    ) : (
                        <>
                            <i className="ri-delete-bin-line me-2"></i>
                            Delete Column
                        </>
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default DeleteColumnModal;
