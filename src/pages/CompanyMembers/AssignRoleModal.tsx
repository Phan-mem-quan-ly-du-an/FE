import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { getCompanyRoles, assignMemberRole, Role, CompanyMember } from '../../apiCaller/companyMembers';
import { isForbiddenError } from '../../helpers/permissions';

interface AssignRoleModalProps {
    show: boolean;
    onClose: () => void;
    companyId: string;
    member: CompanyMember | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export default function AssignRoleModal({
    show,
    onClose,
    companyId,
    member,
    onSuccess,
    onError
}: AssignRoleModalProps) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { data: roles = [] } = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
        enabled: !!companyId && show,
    });

    const assignRoleMutation = useMutation({
        mutationFn: ({ companyId, memberId, roleId }: { companyId: string; memberId: string; roleId: number }) =>
            assignMemberRole(companyId, memberId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyMembers', companyId] });
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

            assignRoleMutation.mutate(
                {
                    companyId,
                    memberId: member.userId,
                    roleId: parseInt(values.roleId),
                },
                {
                    onSuccess: () => {
                        toast.success(t('RoleAssignedSuccessfully') || 'Gán role thành công', {
                            position: 'top-right',
                            autoClose: 3000,
                        });
                        onSuccess?.(t('RoleAssignedSuccessfully'));
                        validation.resetForm();
                        onClose();
                    },
                    onError: (error: any) => {
                        if (isForbiddenError(error)) {
                            toast.warning('Bạn không có quyền này', { 
                                autoClose: 4000,
                                position: 'top-right'
                            });
                            onError?.('Bạn không có quyền này');
                        } else {
                            toast.error(error?.message || t('FailedToAssignRole') || 'Failed to assign role', {
                                position: 'top-right',
                                autoClose: 3000,
                            });
                            onError?.(error?.message || t('FailedToAssignRole'));
                        }
                    },
                }
            );
        },
    });

    useEffect(() => {
        if (member) {
            validation.setFieldValue('roleId', member.roleId?.toString() || '');
        }
    }, [member]);

    if (!member) return null;

    const isOwner = !!member.owner;
    const currentRole = !isOwner && member.roleId
        ? roles.find((r: Role) => r.id === member.roleId)
        : null;

    return (
        <Modal id="assignRoleModal" isOpen={show} toggle={onClose} centered>
            <ModalHeader className="bg-light p-3" toggle={onClose}>
                {t('AssignRole')}
            </ModalHeader>
            <Form
                className="tablelist-form"
                onSubmit={(e: any) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                }}
            >
                <ModalBody>
                    {isOwner && (
                        <div className="alert alert-warning">
                            {t('CannotAssignRoleToOwnerMessage')}
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <tbody>
                            <tr>
                                <th style={{ width: 180 }}>{t('Email')}</th>
                                <td className="font-monospace">{member.email ?? member.invitedEmail ?? member.userId}</td>
                            </tr>
                            <tr>
                                <th>{t('CurrentRole')}</th>
                                <td>
                                    {member.owner ? (
                                        <span className="badge bg-success-subtle text-success text-uppercase">
                                                {t('Owner')}
                                            </span>
                                    ) : currentRole ? (
                                        <span className="badge bg-dark-subtle text-dark text-uppercase">
                                                {currentRole.name || currentRole.code}
                                            </span>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-3">
                        <Label htmlFor="role-field" className="form-label">
                            {t('Role')}
                        </Label>
                        <Input
                            name="roleId"
                            id="role-field"
                            type="select"
                            className="form-select"
                            disabled={isOwner}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.roleId || ''}
                            invalid={!!(validation.touched.roleId && validation.errors.roleId)}
                        >
                            <option value="">{t('SelectRole')}</option>
                            {roles.map((role: Role) => (
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

                    <div className="text-muted small">
                        {t('SelectRoleAndSaveMessage')}
                    </div>
                </ModalBody>

                <div className="modal-footer">
                    <div className="hstack gap-2 justify-content-end">
                        <Button type="button" className="btn btn-light" onClick={onClose}>
                            {t('Close')}
                        </Button>
                        <Button
                            type="submit"
                            className="btn btn-primary"
                            disabled={assignRoleMutation.isPending || isOwner}
                        >
                            {assignRoleMutation.isPending ? t('Saving') : t('Save')}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}