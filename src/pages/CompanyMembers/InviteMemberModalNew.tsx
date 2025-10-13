import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Button} from 'reactstrap';
import {useFormik} from 'formik';
import * as Yup from 'yup';
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
            emails: Yup.string().required("Please enter email addresses"),
            roleId: Yup.string().required("Please select a role")
        }),
        onSubmit: (values) => {
            const emailList = values.emails.split('\n').map(email => email.trim()).filter(email => email);
            if (emailList.length === 0) {
                onError?.('Please enter at least one email address');
                return;
            }
            
            batchInviteMutation.mutate({
                companyId,
                emails: emailList,
                roleId: parseInt(values.roleId)
            }, {
                onSuccess: () => {
                    onSuccess?.('Members invited successfully');
                    validation.resetForm();
                    onClose();
                },
                onError: (error: any) => {
                    onError?.(error?.message || 'Failed to invite members');
                }
            });
        },
    });

    return (
        <Modal id="showModal" isOpen={show} toggle={onClose} centered>
            <ModalHeader className="bg-light p-3" toggle={onClose}>
                Add Members
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e: any) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
            }}>
                <ModalBody>
                    <div className="mb-3">
                        <Label htmlFor="emails-field" className="form-label">
                            Email Addresses
                        </Label>
                        <Input
                            name="emails"
                            id="emails-field"
                            className="form-control"
                            placeholder="Enter email addresses (one per line)"
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
                            Enter one email address per line
                        </small>
                    </div>

                    <div className="mb-3">
                        <Label htmlFor="role-field" className="form-label">
                            Role
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
                            <option value="">— Select Role —</option>
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
                            Close
                        </Button>
                        <Button 
                            type="submit" 
                            className="btn btn-success"
                            disabled={batchInviteMutation.isPending}
                        >
                            {batchInviteMutation.isPending ? 'Inviting...' : 'Add Members'}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}
