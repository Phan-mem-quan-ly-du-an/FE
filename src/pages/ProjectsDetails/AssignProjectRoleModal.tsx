import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectMember } from '../../apiCaller/projectMembers';
import { assignProjectMemberRole } from '../../apiCaller/projectMembers';
import { getProjectRoles, ProjectRole } from '../../apiCaller/projectRoles';

interface AssignProjectRoleModalProps {
    show: boolean;
    onClose: () => void;
    projectId: string;
    member: ProjectMember | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export default function AssignProjectRoleModal({
    show,
    onClose,
    projectId,
    member,
    onSuccess,
    onError,
}: AssignProjectRoleModalProps) {
    const queryClient = useQueryClient();

    const { data: roles = [] } = useQuery<ProjectRole[]>({
        queryKey: ['project-roles', projectId],
        queryFn: () => getProjectRoles(projectId),
        enabled: !!projectId && show,
    });

    const assignRoleMutation = useMutation({
        mutationFn: ({ projectId, memberId, roleId }: { projectId: string; memberId: string; roleId: number }) =>
            assignProjectMemberRole(projectId, memberId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
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
            if ((member as any).owner) {
                onError?.('Cannot assign a role to the owner. Please use the transfer ownership feature.');
                return;
            }
            if (!values.roleId) {
                onError?.('Please select a role');
                return;
            }
            assignRoleMutation.mutate(
                { projectId, memberId: member.userId, roleId: parseInt(values.roleId) },
                {
                    onSuccess: () => {
                        onSuccess?.('Role updated successfully');
                        validation.resetForm();
                        onClose();
                    },
                    onError: (error: any) => {
                        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update role';
                        onError?.(errorMessage);
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

    const isOwner = !!(member as any).owner;

    return (
        <Modal id="assignProjectRoleModal" isOpen={show} toggle={onClose} centered>
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
                            Cannot assign a role to the owner. Please use the transfer ownership feature.
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
                                    <td>{isOwner ? 'OWNER' : (member.roleId ?? '—')}</td>
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
                            {roles.map((role: ProjectRole) => (
                                <option key={role.id} value={role.id}>
                                    {role.name || role.code}
                                </option>
                            ))}
                        </Input>
                        {validation.touched.roleId && validation.errors.roleId ? (
                            <FormFeedback type="invalid">{validation.errors.roleId}</FormFeedback>
                        ) : null}
                    </div>

                    <div className="text-muted small">Select a role and click Save to assign it to the member.</div>
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