import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
            roleId: Yup.string().required(t('PleaseSelectRole')),
        }),
        onSubmit: (values) => {
            if (!member) return;
            if ((member as any).owner) {
                onError?.(t('CannotAssignRoleToOwnerProject'));
                return;
            }
            if (!values.roleId) {
                onError?.(t('PleaseSelectRole'));
                return;
            }
            assignRoleMutation.mutate(
                { projectId, memberId: member.userId, roleId: parseInt(values.roleId) },
                {
                    onSuccess: () => {
                        onSuccess?.(t('RoleUpdatedSuccessfully'));
                        validation.resetForm();
                        onClose();
                    },
                    onError: (error: any) => {
                        const errorMessage = error?.response?.data?.message || error?.message || t('FailedToUpdateRole');
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
                {t('AssignRole')}
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e: any) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
            }}>
                <ModalBody>
                    {isOwner && (
                        <div className="alert alert-warning">
                            {t('CannotAssignRoleToOwnerProject')}
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <tbody>
                                <tr>
                                    <th style={{ width: 180 }}>{t('Email')}</th>
                                    <td>{member.email || member.userId}</td>
                                </tr>
                                <tr>
                                    <th>{t('CurrentRoleID')}</th>
                                    <td>{isOwner ? 'OWNER' : (member.roleId ?? '—')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-3">
                        <Label htmlFor="role-field" className="form-label">{t('Role')}</Label>
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
                            <option value="">{t('SelectRole')}</option>
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

                    <div className="text-muted small">{t('SelectRoleAndSave')}</div>
                </ModalBody>
                <div className="modal-footer">
                    <div className="hstack gap-2 justify-content-end">
                        <Button type="button" className="btn btn-light" onClick={onClose}>{t('Close')}</Button>
                        <Button type="submit" className="btn btn-primary" disabled={assignRoleMutation.isPending || isOwner}>
                            {assignRoleMutation.isPending ? t('Saving') : t('Save')}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}