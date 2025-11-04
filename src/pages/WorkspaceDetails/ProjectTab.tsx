import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Table, Spinner, Badge, Card, CardBody, CardHeader, Button } from 'reactstrap';
import { useQuery } from '@tanstack/react-query';
import { getProjectsByWorkspaceId, Project } from '../../apiCaller/workspaceDetails';
import { getWorkspaceById, Workspace } from '../../apiCaller/workspaceDetails';

const ProjectTab: React.FC = () => {
    const { companyId, workspaceId } = useParams<{ companyId: string, workspaceId: string }>();
    
    const {
        data: projects = [],
        isLoading,
        error,
    } = useQuery<Project[]>({
        queryKey: ['workspace-projects', workspaceId],
        queryFn: () => getProjectsByWorkspaceId(workspaceId!),
        enabled: !!workspaceId,
    });

    const { data: workspace } = useQuery<Workspace>({
        queryKey: ['workspace', workspaceId],
        queryFn: () => getWorkspaceById(workspaceId!),
        enabled: !!workspaceId,
        staleTime: 60_000,
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">Loading projects...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger text-center">
                <i className="ri-error-warning-line me-2"></i>
                Failed to load projects
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="px-4 py-4">
                <Card>
                    <CardBody>
                        <div className="text-center py-5">
                            <i className="ri-folder-open-line fs-1 text-muted"></i>
                            <p className="text-muted mt-2">No projects in this workspace yet.</p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Projects</h5>
                        <Button color="success" size="sm">
                            <i className="ri-add-line me-1"></i> Create Project
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Description</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Created At</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project.id}>
                                        <td>
                                            <Link 
                                                to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                state={{ companyId: workspace?.companyId || companyId }}
                                                className="fw-semibold link-primary"
                                            >
                                                {project.name}
                                            </Link>
                                        </td>
                                        <td className="text-muted">
                                            {project.description || 'No description'}
                                        </td>
                                        <td>
                                            {project.archivedAt ? (
                                                <Badge color="secondary">Archived</Badge>
                                            ) : (
                                                <Badge color="success">Active</Badge>
                                            )}
                                        </td>
                                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Link 
                                                to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                state={{ companyId: workspace?.companyId || companyId }}
                                                className="text-primary"
                                                title="View details"
                                            >
                                                <i className="ri-eye-fill fs-16"></i>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ProjectTab;
