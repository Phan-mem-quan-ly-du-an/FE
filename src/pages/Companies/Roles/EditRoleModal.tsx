import { useTranslation } from "react-i18next";
import { Button, Form, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";

export type EditRoleModalProps = {
    show: boolean;
    onClose: () => void;
    initial: { code: string; name?: string | null; description?: string | null };
    onSubmit: (values: { code: string; name?: string | null; description?: string | null }) => Promise<void> | void;
    isSubmitting?: boolean;
    error?: string | null;
};

export default function EditRoleModal({ show, onClose, onSubmit, isSubmitting: externalIsSubmitting, initial, error }: EditRoleModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: { code: initial.code || "", name: initial.name || "", description: initial.description || "" },
        validationSchema: Yup.object({
            code: Yup.string().required(t('PleaseEnterRoleCode')),
            name: Yup.string().required(t('PleaseEnterRoleName')),
            description: Yup.string().nullable(),
        }),
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                await onSubmit({
                    code: values.code.trim(),
                    name: values.name?.trim() || null,
                    description: values.description?.trim() || null,
                });
            } catch (error) {
                console.error("Error submitting role:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    });

    const handleToggle = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <Modal isOpen={show} toggle={handleToggle} centered>
            <ModalHeader toggle={handleToggle}>{t('Edit')}</ModalHeader>
            <ModalBody>
                {error && (
                    <div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
                        <strong>⚠️ {t('Error')}:</strong> {error}
                    </div>
                )}
                <Form onSubmit={formik.handleSubmit}>
                    <div className="mb-3">
                        <Label htmlFor="role-code">{t('RoleCode')}</Label>
                        <Input id="role-code" name="code" type="text" placeholder={t('EnterRoleCode')} onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.code} invalid={!!(formik.touched.code && formik.errors.code)} />
                        {formik.touched.code && formik.errors.code ? (<FormFeedback>{formik.errors.code}</FormFeedback>) : null}
                    </div>
                    <div className="mb-3">
                        <Label htmlFor="role-name">{t('RoleName')}</Label>
                        <Input id="role-name" name="name" type="text" placeholder={t('EnterRoleName')} onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name} invalid={!!(formik.touched.name && formik.errors.name)} />
                        {formik.touched.name && formik.errors.name ? (<FormFeedback>{formik.errors.name}</FormFeedback>) : null}
                    </div>
                    <div className="mb-3">
                        <Label htmlFor="role-desc">{t('Description')}</Label>
                        <Input id="role-desc" name="description" type="textarea" placeholder={t('EnterRoleDescription')} rows={3} onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.description} />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <Button type="button" color="secondary" onClick={onClose} disabled={isSubmitting || externalIsSubmitting}>{t('Close')}</Button>
                        <Button type="submit" color="primary" disabled={isSubmitting || externalIsSubmitting}>{isSubmitting || externalIsSubmitting ? t('Saving') : t('Save')}</Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    );
}


