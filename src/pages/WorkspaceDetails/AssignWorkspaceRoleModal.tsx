import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkspaceMember, assignWorkspaceMemberRole } from '../../apiCaller/workspaceDetails';
import { getWorkspaceRoles, WorkspaceRole } from '../../apiCaller/workspaceRoles';
import { isForbiddenError } from '../../helpers/permissions';

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
}: Readonly<AssignWorkspaceRoleModalProps>) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { data: roles = [], error: rolesError, isLoading: rolesLoading } = useQuery<WorkspaceRole[]>({
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
            roleId: Yup.string().required(t('PleaseSelectRole')),
        }),
        onSubmit: (values) => {
            if (!member) return;
            if (member.owner) {
                onError?.(t('CannotAssignRoleToOwner'));
                return;
            }
            if (!values.roleId) {
                onError?.(t('SelectRoleErrorMessage'));
                return;
            }
            assignRoleMutation.mutate(
                { workspaceId, memberId: member.userId, roleId: Number.parseInt(values.roleId, 10) },
                {
                    onSuccess: () => {
                        onSuccess?.(t('RoleAssignedSuccessfully'));
                        validation.resetForm();
                        onClose();
                    },
                    onError: (error: any) => {
                        if (isForbiddenError(error)) {
                            onError?.(t('WorkspacePermissions.AssignMemberRoleDenied') || 'Bạn không có quyền gán role cho thành viên.');
                            return;
                        }
                        onError?.(error?.message || t('FailedToAssignRole'));
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
                {t('AssignRoleTitle')}
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e: any) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
            }}>
                <ModalBody>
                    {isOwner && (
                        <div className="alert alert-warning">
                            {t('CannotAssignRoleToOwner')}
                        </div>
                    )}

                    {rolesError && (
                        <div className={`alert ${isForbiddenError(rolesError) ? 'alert-warning' : 'alert-danger'}`}>
                            {isForbiddenError(rolesError)
                                ? (t('WorkspacePermissions.ViewRolesDenied') || 'Bạn không có quyền xem danh sách role của workspace.')
                                : 'Không thể tải danh sách role.'}
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <tbody>
                                <tr>
                                    <th style={{ inlineSize: 180 }}>{t('WorkspaceMemberId')}</th>
                                    <td className="font-monospace">{member.userId}</td>
                                </tr>
                                <tr>
                                    <th>{t('CurrentRole')}</th>
                                    <td>{member.owner ? t('Owner') : (member.roleId ?? '—')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-3">
                        <Label htmlFor="role-field" className="form-label">{t('MemberRole')}</Label>
                        <Input
                            name="roleId"
                            id="role-field"
                            type="select"
                            className="form-select"
                            disabled={isOwner || rolesLoading || !!rolesError}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.roleId || ''}
                            invalid={validation.touched.roleId && !!validation.errors.roleId}
                        >
                            <option value="">{t('SelectWorkspaceRole')}</option>
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

                    <div className="text-muted small">{t('SelectRoleAndClickSave')}</div>
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