import React from "react";
import { useParams } from "react-router-dom";
import { Spinner, Card, CardBody, Row, Col } from "reactstrap";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getWorkspaceById, Workspace } from "../../apiCaller/workspaceDetails";

const OverviewTab = () => {
    const { t } = useTranslation();
    const { workspaceId } = useParams<{ workspaceId: string }>();

    const {
        data: workspace,
        isLoading,
        error,
    } = useQuery<Workspace>({
        queryKey: ["workspace", workspaceId],
        queryFn: () => getWorkspaceById(workspaceId!),
        enabled: !!workspaceId,
    });

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">{t('LoadingWorkspace')}</p>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="alert alert-danger text-center my-4">
                <i className="ri-error-warning-line me-2" />
                {t('FailedLoadWorkspaceDetails')}
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <Row className="g-4">
                {/* Description Card */}
                <Col lg={8}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title mb-3">
                                <i className="ri-file-text-line me-2" />
                                {t('WorkspaceDescription')}
                            </h5>
                            <p className="text-muted mb-0">
                                {workspace.description || t('NoDescriptionAvailable')}
                            </p>
                        </CardBody>
                    </Card>
                </Col>




            </Row>
        </div>
    );
};

export default OverviewTab;

