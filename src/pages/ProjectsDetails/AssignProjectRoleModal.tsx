import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectMember } from '../../apiCaller/projectMembers';
import { assignProjectMemberRole } from '../../apiCaller/projectMembers';
import { getProjectRoles, ProjectRole } from '../../apiCaller/projectRoles';
import { useAuth } from 'react-oidc-context';
import { isForbiddenError } from '../../helpers/permissions';

// Permission interface
export type Permission = {
    id: number;
    scope: "company" | "workspace" | "project";
    code: string;
    name: string;
};

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
    const auth = useAuth();
    const base = (process.env.REACT_APP_API_URL as string) || window.location.origin;

    function getAuthHeaders(extra?: Record<string, string>): HeadersInit {
        const accessToken = auth.user?.access_token;
        return { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(extra ?? {}) };
    }

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

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [permissionsError, setPermissionsError] = useState<string | null>(null);

    const { data: allProjectPermissions = [] } = useQuery<Permission[]>({
        queryKey: ['allProjectPermissions'],
        queryFn: async () => {
            const res = await fetch(new URL(`/api/permissions?scope=project`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            console.log("All Project Permissions:", data);
            return data;
        },
        enabled: !!auth.user?.access_token && show,
    });

    const fetchRolePermissions = useCallback(async (roleId: number) => {
        setLoadingPermissions(true);
        setPermissionsError(null);
        try {
            const res = await fetch(new URL(`/api/roles/${roleId}/permissions`, base).toString(), {
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                if (res.status === 403) {
                    setPermissionsError(t("ProjectPermissions.AssignRolePermissionDenied") || "Bạn không có quyền xem hoặc gán permission cho role này.");
                } else {
                    setPermissionsError(t("LoadPermissionsError", { status: res.status, text: await res.text() }) || "");
                }
                setSelectedPermissions(new Set());
                return;
            }
            const ids: number[] = await res.json();
            console.log(`Permissions for role ${roleId}:`, ids);
            setSelectedPermissions(new Set(ids || []));
        } catch (e: any) {
            if (isForbiddenError(e)) {
                setPermissionsError(t("ProjectPermissions.AssignRolePermissionDenied") || "Bạn không có quyền xem hoặc gán permission cho role này.");
            } else {
                setPermissionsError(e?.message || t("ErrorLoadingData") || "Lỗi tải dữ liệu");
            }
            setSelectedPermissions(new Set());
        } finally {
            setLoadingPermissions(false);
        }
    }, [auth.user?.access_token, base, getAuthHeaders, t]);

    useEffect(() => {
        if (allProjectPermissions.length > 0) {
            setPermissions(allProjectPermissions);
        }
    }, [allProjectPermissions]);

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
        const selectedRoleId = validation.values.roleId;
        if (show && selectedRoleId) {
            fetchRolePermissions(parseInt(selectedRoleId));
        } else if (!show) {
            setSelectedPermissions(new Set());
        }
    }, [show, validation.values.roleId, fetchRolePermissions]);

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

                    {validation.values.roleId && ( // Only show permissions if a role is selected
                        <div className="mb-3">
                            <Label className="form-label">{t('Permissions')}</Label>
                            {permissionsError && (
                                <div className="alert alert-danger">
                                    {permissionsError}
                                </div>
                            )}
                            {loadingPermissions ? (
                                <div>{t('LoadingPermissions')}</div>
                            ) : (
                                <div className="table-responsive table-card mb-1 mt-0">
                                    <table className="table align-middle table-nowrap">
                                        <thead className="table-light text-muted text-uppercase">
                                            <tr>
                                                <th style={{ width: 320 }}>{t('PermissionName')}</th>
                                                <th className="text-center" style={{ width: 140 }}>{t('Tick')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {permissions.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="fw-semibold">{p.name}</div>
                                                        {p.code && <div className="text-muted small">{p.code}</div>}
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedPermissions.has(p.id)}
                                                            disabled={true} // Permissions are read-only in this modal
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

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