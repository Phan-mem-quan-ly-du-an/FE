import React from 'react';
import { Modal, ModalHeader, ModalBody, Form, Row, Col, Label, Input, FormFeedback, ModalFooter, Button } from 'reactstrap';
import * as Yup from "yup";
import { useFormik } from "formik";
import { Workspace, createWorkspace, updateWorkspace } from "../../apiCaller/workspaces";
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

interface AddEditWorkspaceModalProps {
    isOpen: boolean;
    toggle: () => void;
    isEdit: boolean;
    workspace: Workspace | null;
    companyId: string;
    onSuccess: () => void;
}

const AddEditWorkspaceModal: React.FC<AddEditWorkspaceModalProps> = ({ isOpen, toggle, isEdit, workspace, companyId, onSuccess }) => {
    const { t } = useTranslation();

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: workspace?.name || "",
            description: workspace?.description || "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required(t('t-workspace-form-name-validation')),
        }),
        onSubmit: async (values) => {
            try {
                if (isEdit && workspace) {
                    await updateWorkspace(companyId, workspace.id, values);
                    toast.success(t('t-workspace-toast-update-success'));
                } else {
                    await createWorkspace(companyId, values);
                    toast.success(t('t-workspace-toast-add-success'));
                }
                toggle();
                onSuccess();
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 409) {
                    toast.error(t('t-workspace-toast-duplicate-error', { name: values.name }));
                } else {
                    toast.error(t('t-workspace-toast-generic-error'));
                }
            }
        },
    });

    return (
        <Modal id="showModal" isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader className="bg-primary-subtle p-3" toggle={toggle}>
                {isEdit ? t('t-workspace-modal-edit-title') : t('t-workspace-modal-add-title')}
            </ModalHeader>
            <Form className="tablelist-form" onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                <ModalBody>
                    <Row className="g-3">
                        <Col lg={12}>
                            <div>
                                <Label htmlFor="name-field" className="form-label">{t('t-workspace-form-name-label')}</Label>
                                <Input
                                    name="name"
                                    id="name-field"
                                    className="form-control"
                                    placeholder={t('t-workspace-form-name-placeholder')}
                                    type="text"
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.name || ""}
                                    invalid={validation.touched.name && !!validation.errors.name}
                                />
                                {validation.touched.name && validation.errors.name ? (
                                    <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
                                ) : null}
                            </div>
                        </Col>
                        <Col lg={12}>
                            <div>
                                <Label htmlFor="description-field" className="form-label">{t('t-workspace-form-description-label')}</Label>
                                <Input
                                    name="description"
                                    id="description-field"
                                    className="form-control"
                                    placeholder={t('t-workspace-form-description-placeholder')}
                                    type="textarea"
                                    rows={4}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.description || ""}
                                />
                            </div>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <div className="hstack gap-2 justify-content-end">
                        <Button color="light" onClick={toggle} disabled={validation.isSubmitting}>{t('t-workspace-form-close-btn')}</Button>
                        <Button type="submit" color="success" disabled={validation.isSubmitting}>
                            {validation.isSubmitting ? 
                                (isEdit ? t('t-workspace-form-updating-btn') : t('t-workspace-form-adding-btn')) : 
                                (isEdit ? t('t-workspace-form-update-btn') : t('t-workspace-form-add-btn'))
                            }
                        </Button>
                    </div>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default AddEditWorkspaceModal;