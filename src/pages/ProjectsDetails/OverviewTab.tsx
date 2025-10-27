import React from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Spinner } from "reactstrap";
import { useQuery } from "@tanstack/react-query";
import { getProjectById, Project } from "../../apiCaller/projects";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const OverviewTab = () => {
    const { t } = useTranslation();
    const { projectId } = useParams<{ projectId: string }>();

    const {
        data: project,
        isLoading,
        error,
    } = useQuery<Project>({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
        retry: 1,
        meta: {
            onError: () => toast.error(t("FailedToLoadProjectDetails")),
        },
    });

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">{t("LoadingProjectDetails")}</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="alert alert-danger text-center my-4">
                <i className="ri-error-warning-line me-2"></i>
                {t("ProjectNotFound")}
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <h5 className="fw-bold text-uppercase mb-3">{t("Summary")}</h5>
            <p className="text-muted">
                {project.description || t("NoDescriptionProvided")}
            </p>

            <ul className="ps-4 vstack gap-2 mb-4">
                <li>
                    <strong>{t("ProjectID")}:</strong> {project.id}
                </li>
                <li>
                    <strong>{t("WorkspaceID")}:</strong> {project.workspaceId}
                </li>
                <li>
                    <strong>{t("ColorTheme")}:</strong>{" "}
                    <span style={{ color: project.color }}>{project.color}</span>
                </li>
            </ul>

            <Row className="gy-3 border-top border-top-dashed pt-3">
                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">
                        {t("CreatedAt")}
                    </p>
                    <h5 className="fs-15 mb-0">
                        {new Date(project.createdAt).toLocaleDateString()}
                    </h5>
                </Col>

                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">
                        {t("LastUpdated")}
                    </p>
                    <h5 className="fs-15 mb-0">
                        {new Date(project.updatedAt).toLocaleDateString()}
                    </h5>
                </Col>

                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">
                        {t("Status")}
                    </p>
                    <div
                        className={`badge fs-12 ${
                            project.status === "active"
                                ? "bg-success"
                                : "bg-secondary"
                        }`}
                    >
                        {t(project.status)}
                    </div>
                </Col>

                {project.archivedAt && (
                    <Col lg={3} sm={6}>
                        <p className="mb-1 text-uppercase fw-medium text-muted">
                            {t("ArchivedAt")}
                        </p>
                        <h5 className="fs-15 mb-0">
                            {new Date(project.archivedAt).toLocaleDateString()}
                        </h5>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default OverviewTab;
