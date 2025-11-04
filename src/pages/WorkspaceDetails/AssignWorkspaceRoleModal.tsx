import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkspaceMember, assignWorkspaceMemberRole } from '../../apiCaller/workspaceDetails';
import { getWorkspaceRoles, WorkspaceRole } from '../../apiCaller/workspaceRoles';

interface AssignWorkspaceRoleModalProps {
    show: boolean;
    onClose: () => void;
    workspaceId: string;
    member: WorkspaceMember | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export default function AssignWorkspaceRoleModal({
    show,
    onClose,
    workspaceId,
    member,
    onSuccess,
    onError,
}: AssignWorkspaceRoleModalProps) {
    const queryClient = useQueryClient();

    const { data: roles = [] } = useQuery<WorkspaceRole[]>({
        queryKey: ['workspace-roles', workspaceId],
        queryFn: () => getWorkspaceRoles(workspaceId),
        enabled: !!workspaceId && show,
    });

    const assignRoleMutation = useMutation({
        mutationFn: ({ workspaceId, memberId, roleId }: { workspaceId: string; memberId: string; roleId: number }) =>
            assignWorkspaceMemberRole(workspaceId, memberId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
        },
    });

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            roleId: member?.roleId?.toString() || '',
        },
        validationSchema: Yup.object({
            roleId: Yup.string().required('Please select a role'),
        }),
        onSubmit: (values) => {
            if (!member) return;
            if (member.owner) {
                onError?.('Không thể gán role cho Owner. Hãy dùng chuyển quyền sở hữu.');
                return;
            }
            if (!values.roleId) {
                onError?.('Vui lòng chọn role');
                return;
            }
            assignRoleMutation.mutate(
                { workspaceId, memberId: member.userId, roleId: parseInt(values.roleId) },
                {
                    onSuccess: () => {
                        onSuccess?.('Cập nhật role thành công');
                        validation.resetForm();
                        onClose();
                    },
                    onError: (error: any) => {
                        onError?.(error?.message || 'Cập nhật role thất bại');
                    },
                }
            );
        },
    });

    useEffect(() => {
        if (member) {
            validation.setFieldValue('roleId', member.roleId?.toString() || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [member]);

    if (!member) return null;

    const isOwner = !!member.owner;

    return (
        <Modal id="assignWorkspaceRoleModal" isOpen={show} toggle={onClose} centered>
            <ModalHeader className="bg-light p-3" toggle={onClose}>
                Assign Role
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e: any) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
            }}>
                <ModalBody>
                    {isOwner && (
                        <div className="alert alert-warning">
                            Không thể gán role cho Owner. Hãy dùng chức năng chuyển quyền sở hữu.
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <tbody>
                                <tr>
                                    <th style={{ width: 180 }}>Member (userId)</th>
                                    <td className="font-monospace">{member.userId}</td>
                                </tr>
                                <tr>
                                    <th>Current Role ID</th>
                                    <td>{member.owner ? 'OWNER' : (member.roleId ?? '—')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-3">
                        <Label htmlFor="role-field" className="form-label">Role</Label>
                        <Input
                            name="roleId"
                            id="role-field"
                            type="select"
                            className="form-select"
                            disabled={isOwner}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.roleId || ''}
                            invalid={validation.touched.roleId && !!validation.errors.roleId}
                        >
                            <option value="">Select a role</option>
                            {roles.map((role: WorkspaceRole) => (
                                <option key={role.id} value={role.id}>
                                    {role.code}
                                    {role.name ? ` - ${role.name}` : ''}
                                </option>
                            ))}
                        </Input>
                        {validation.touched.roleId && validation.errors.roleId ? (
                            <FormFeedback type="invalid">{validation.errors.roleId}</FormFeedback>
                        ) : null}
                    </div>

                    <div className="text-muted small">Chọn role và bấm Save để gán cho thành viên.</div>
                </ModalBody>
                <div className="modal-footer">
                    <div className="hstack gap-2 justify-content-end">
                        <Button type="button" className="btn btn-light" onClick={onClose}>Close</Button>
                        <Button type="submit" className="btn btn-primary" disabled={assignRoleMutation.isPending || isOwner}>
                            {assignRoleMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}


