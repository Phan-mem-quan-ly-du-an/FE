import React from "react";
import { useParams } from "react-router-dom";
import { Spinner, Card, CardBody, Row, Col } from "reactstrap";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceById, Workspace } from "../../apiCaller/workspaceDetails";

const OverviewTab = () => {
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
                <p className="mt-2 text-muted">Loading workspace details...</p>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="alert alert-danger text-center my-4">
                <i className="ri-error-warning-line me-2"></i>
                Failed to load workspace details
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
                                <i className="ri-file-text-line me-2"></i>
                                Description
                            </h5>
                            <p className="text-muted mb-0">
                                {workspace.description || "No description available."}
                            </p>
                        </CardBody>
                    </Card>
                </Col>

                {/* Quick Info */}
                <Col lg={4}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title mb-3">
                                <i className="ri-information-line me-2"></i>
                                Information
                            </h5>
                            <div className="vstack gap-2">
                                <div>
                                    <small className="text-muted d-block">Workspace ID</small>
                                    <span className="font-monospace small">{workspace.id}</span>
                                </div>
                                <div className="border-top pt-2">
                                    <small className="text-muted d-block">Company ID</small>
                                    <span className="font-monospace small">{workspace.companyId}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Timeline */}
                <Col lg={12}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title mb-3">
                                <i className="ri-time-line me-2"></i>
                                Timeline
                            </h5>
                            <Row>
                                <Col md={4}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">Created</small>
                                        <span className="fw-semibold">
                                            {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">Last Updated</small>
                                        <span className="fw-semibold">
                                            {new Date(workspace.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </Col>
                                {workspace.archivedAt && (
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <small className="text-muted d-block">Archived</small>
                                            <span className="fw-semibold text-danger">
                                                {new Date(workspace.archivedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OverviewTab;

