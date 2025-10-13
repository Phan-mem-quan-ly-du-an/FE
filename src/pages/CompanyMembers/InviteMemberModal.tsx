import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button} from 'reactstrap';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {useTranslation} from 'react-i18next';
import {batchInviteMembers, getCompanyRoles, Role} from '../../apiCaller/companyMembers';

interface InviteMemberModalProps {
    show: boolean;
    onClose: () => void;
    companyId: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export default function InviteMemberModal({
    show,
    onClose,
    companyId,
    onSuccess,
    onError
}: InviteMemberModalProps) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    // Get roles for the company
    const {data: roles = []} = useQuery({
        queryKey: ['companyRoles', companyId],
        queryFn: () => getCompanyRoles(companyId, true),
        enabled: !!companyId && show,
    });

    const batchInviteMutation = useMutation({
        mutationFn: ({companyId, emails, roleId}: { companyId: string; emails: string[]; roleId: number }) =>
            batchInviteMembers(companyId, emails, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companyMembers', companyId]});
        },
    });

    // Formik validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            emails: '',
            roleId: '',
        },
        validationSchema: Yup.object({
            emails: Yup.string()
                .required(t('PleaseEnterEmailAddresses'))
                .test('email-format', t('PleaseEnterValidEmailAddresses'), function(value) {
                    if (!value) return true;
                    const emailList = value.split('\n').map(email => email.trim()).filter(email => email);
                    if (emailList.length === 0) return true;
                    
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
                    
                    if (invalidEmails.length > 0) {
                        return this.createError({
                            message: `${t('InvalidEmailFormat')}: ${invalidEmails.join(', ')}`
                        });
                    }
                    return true;
                }),
            roleId: Yup.string().required(t('PleaseSelectRole'))
        }),
        onSubmit: (values) => {
            const emailList = values.emails.split('\n').map(email => email.trim()).filter(email => email);
            if (emailList.length === 0) {
                onError?.(t('PleaseEnterAtLeastOneEmail'));
                return;
            }
            
            // Additional validation before submit
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emailList.filter(email => !emailRegex.test(email));
            if (invalidEmails.length > 0) {
                onError?.(`${t('InvalidEmailFormat')}: ${invalidEmails.join(', ')}`);
                return;
            }
            
            batchInviteMutation.mutate({
                companyId,
                emails: emailList,
                roleId: parseInt(values.roleId)
            }, {
                onSuccess: () => {
                    onSuccess?.(t('MembersInvitedSuccessfully'));
                    validation.resetForm();
                    onClose();
                },
                onError: (error: any) => {
                    onError?.(error?.message || t('FailedToInviteMembers'));
                }
            });
        },
    });

    return (
        <Modal id="showModal" isOpen={show} toggle={onClose} centered>
            <ModalHeader className="bg-light p-3" toggle={onClose}>
                {t('AddMembers')}
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e: any) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
            }}>
                <ModalBody>
                    <div className="mb-3">
                        <Label htmlFor="emails-field" className="form-label">
                            {t('EmailAddresses')}
                        </Label>
                        <Input
                            name="emails"
                            id="emails-field"
                            className="form-control"
                            placeholder={t('EnterEmailAddressesOnePerLine')}
                            type="textarea"
                            rows={4}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.emails || ""}
                            invalid={
                                validation.touched.emails && validation.errors.emails ? true : false
                            }
                        />
                        {validation.touched.emails && validation.errors.emails ? (
                            <FormFeedback type="invalid">{validation.errors.emails}</FormFeedback>
                        ) : null}
                        <small className="form-text text-muted">
                            {t('EnterOneEmailAddressPerLine')}
                        </small>
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
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.roleId || ""}
                            invalid={
                                validation.touched.roleId && validation.errors.roleId ? true : false
                            }
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
                </ModalBody>
                <div className="modal-footer">
                    <div className="hstack gap-2 justify-content-end">
                        <Button
                            type="button"
                            className="btn btn-light"
                            onClick={onClose}
                        >
                            {t('Close')}
                        </Button>
                        <Button 
                            type="submit" 
                            className="btn btn-success"
                            disabled={batchInviteMutation.isPending}
                        >
                            {batchInviteMutation.isPending ? t('Inviting') : t('AddMembersButton')}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}
