import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Spinner } from "reactstrap";
import { getProjectById, Project } from "../../apiCaller/projects";
import { toast } from "react-toastify";

const OverviewTab = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                if (!projectId) return;
                const data = await getProjectById(projectId);
                setProject(data);
            } catch (error) {
                console.error("Error fetching project:", error);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2 text-muted">Loading project details...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="alert alert-danger text-center my-4">
                <i className="ri-error-warning-line me-2"></i> Project not found.
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <h5 className="fw-bold text-uppercase mb-3">Summary</h5>
            <p className="text-muted">{project.description || "No description provided."}</p>

            <ul className="ps-4 vstack gap-2 mb-4">
                <li><strong>Project ID:</strong> {project.id}</li>
                <li><strong>Workspace ID:</strong> {project.workspaceId}</li>
                <li>
                    <strong>Color Theme:</strong>{" "}
                    <span style={{ color: project.color }}>{project.color}</span>
                </li>
            </ul>

            <Row className="gy-3 border-top border-top-dashed pt-3">
                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">Created At</p>
                    <h5 className="fs-15 mb-0">
                        {new Date(project.createdAt).toLocaleDateString()}
                    </h5>
                </Col>

                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">Last Updated</p>
                    <h5 className="fs-15 mb-0">
                        {new Date(project.updatedAt).toLocaleDateString()}
                    </h5>
                </Col>

                <Col lg={3} sm={6}>
                    <p className="mb-1 text-uppercase fw-medium text-muted">Status</p>
                    <div
                        className={`badge fs-12 ${
                            project.status === "active" ? "bg-success" : "bg-secondary"
                        }`}
                    >
                        {project.status}
                    </div>
                </Col>

                {project.archivedAt && (
                    <Col lg={3} sm={6}>
                        <p className="mb-1 text-uppercase fw-medium text-muted">Archived At</p>
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
