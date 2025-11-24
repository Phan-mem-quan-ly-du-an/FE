import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Table,
    Spinner,
    Badge,
    Card,
    CardBody,
    CardHeader,
    Button,
    Col
} from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import { getProjectsByWorkspaceId, Project, getWorkspaceById, Workspace } from '../../apiCaller/workspaceDetails';
import { deleteProject } from '../../apiCaller/projects';
import { isForbiddenError } from '../../helpers/permissions';
import slack from '../../assets/images/brands/slack.png';
import dribbble from '../../assets/images/brands/dribbble.png';
import mailChimp from '../../assets/images/brands/mail_chimp.png';
import dropbox from '../../assets/images/brands/dropbox.png';
import FeatherIcon from 'feather-icons-react';
import DeleteModal from '../ProjectList/DeleteModal';
import EditProjectModal from '../ProjectList/EditProjectModal';
import CreateProjectModal from '../ProjectList/CreateProjectModal';

const ProjectTab: React.FC = () => {
    const { companyId, workspaceId } = useParams<{ companyId: string, workspaceId: string }>();
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [editModal, setEditModal] = useState<boolean>(false);
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const queryClient = useQueryClient();
    
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

    const imageMap = [slack, dribbble, mailChimp, dropbox];

    const getProjectImage = (index: number) => imageMap[index % imageMap.length];
    const getProjectColor = (project: Project) => project.color || '#3b82f6';

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
            setDeleteModal(false);
            toast.success(t('ProjectDeletedSuccessfully') || 'Project deleted successfully');
        },
        onError: (err: unknown) => {
            console.error('Error deleting project:', err);
            if (isForbiddenError(err)) {
                toast.error(t('ProjectPermissions.DeleteProjectDenied') || 'Bạn không có quyền xóa dự án này.');
            } else {
                toast.error(t('FailedToDeleteProject') || 'Failed to delete project');
            }
        }
    });

    const onClickDelete = (project: Project) => {
        setSelectedProject(project);
        setDeleteModal(true);
    };

    const onClickEdit = (project: Project) => {
        setSelectedProject(project);
        setEditModal(true);
    };

    const handleCreateProject = () => {
        setCreateModal(true);
    };

    const handleDeleteProject = () => {
        if (selectedProject) {
            deleteProjectMutation.mutate(selectedProject.id);
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner color="primary" />
                <span className="ms-2">{t('LoadingProjects') || 'Loading projects...'}</span>
            </div>
        );
    }

    if (error) {
        const forbidden = isForbiddenError(error);
        return (
            <div className={`alert ${forbidden ? 'alert-warning' : 'alert-danger'} text-center`}>
                <i className="ri-error-warning-line me-2"></i>
                {forbidden ? (t('WorkspacePermissions.ViewProjectsDenied') || 'Bạn không có quyền xem dự án của workspace này.') : (t('FailedToLoadProjects') || 'Failed to load projects')}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="px-4 py-4">
                <ToastContainer closeButton={false} />
                <DeleteModal
                    show={deleteModal}
                    onDeleteClick={handleDeleteProject}
                    onCloseClick={() => setDeleteModal(false)}
                    isLoading={deleteProjectMutation.isPending}
                />
                <EditProjectModal
                    open={editModal}
                    onClose={() => setEditModal(false)}
                    onUpdated={() => {
                        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
                    }}
                    project={selectedProject}
                />
                <CreateProjectModal
                    open={createModal}
                    onClose={() => setCreateModal(false)}
                    onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
                    }}
                />
                <Card>
                    <CardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{t('Projects') || 'Projects'}</h5>
                            <div className="d-flex gap-2">
                                <Button color="success" size="sm" onClick={handleCreateProject}>
                                    <i className="ri-add-line me-1"></i> {t('AddProject') || 'Add Project'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="text-center py-5">
                            <i className="ri-folder-open-line fs-1 text-muted"></i>
                            <p className="text-muted mt-2">{t('NoProjectsInWorkspace') || 'No projects in this workspace yet.'}</p>
                            <div className="mt-3">
                                <Button color="success" onClick={handleCreateProject}>
                                    <i className="ri-add-line me-1"></i> {t('AddProject') || 'Add Project'}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const renderCardView = () => (
        <div className="row">
            {projects.map((project, index) => (
                <Col xxl={3} sm={6} key={project.id} className="project-card">
                    <Card className="card-height-100">
                        <CardBody>
                            <div className="d-flex flex-column h-100">
                                <div className="d-flex">
                                    <div className="flex-grow-1"></div>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1 align-items-center">
                                            <Link
                                                to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                state={{ companyId: workspace?.companyId || companyId }}
                                                className="btn btn-link text-muted p-1 mt-n2 py-0 text-decoration-none fs-15"
                                            >
                                                <FeatherIcon icon="more-horizontal" className="icon-sm"/>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex mb-2">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm">
                                            <span
                                                className="avatar-title rounded p-2"
                                                style={{ backgroundColor: getProjectColor(project) }}
                                            >
                                              <img src={getProjectImage(index)} alt="" className="img-fluid p-1" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center mb-1">
                                            <h5 className="mb-0 fs-15 me-2">
                                                <Link
                                                    to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                    state={{ companyId: workspace?.companyId || companyId }}
                                                    className="text-dark"
                                                >
                                                    {project.name}
                                                </Link>
                                            </h5>
                                            {project.archivedAt ? (
                                                <Badge color="secondary" className="badge-soft-secondary">{t('Archived') || 'Archived'}</Badge>
                                            ) : (
                                                <Badge color="success" className="badge-soft-success">{t('Active') || 'Active'}</Badge>
                                            )}
                                        </div>
                                        <p className="text-muted text-truncate-two-lines mb-3">
                                            {project.description || t('NoDescription') || 'No description'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                        <div className="card-footer bg-transparent border-top-dashed py-2">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1"></div>
                                <div className="flex-shrink-0">
                                    <div className="text-muted">
                                        <i className="ri-calendar-event-fill me-1 align-bottom"></i>
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            ))}
                    </div>
    );

    const renderListView = () => (
                    <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                    <th scope="col">{t('Name') || 'Name'}</th>
                    <th scope="col">{t('Description') || 'Description'}</th>
                    <th scope="col">{t('Status') || 'Status'}</th>
                    <th scope="col">{t('CreatedAt') || 'Created At'}</th>
                    <th scope="col">{t('Actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                {projects.map((project, index) => (
                                    <tr key={project.id}>
                                        <td>
                            <div className="d-flex align-items-center">
                                <div className="avatar-sm me-2">
                                        <span
                                            className="avatar-title rounded p-1"
                                            style={{ backgroundColor: getProjectColor(project) }}
                                        >
                                            <img src={getProjectImage(index)} alt="" className="img-fluid p-1" />
                                        </span>
                                </div>
                                            <Link 
                                                to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                state={{ companyId: workspace?.companyId || companyId }}
                                                className="fw-semibold link-primary"
                                            >
                                                {project.name}
                                            </Link>
                            </div>
                                        </td>
                                        <td className="text-muted">
                            {project.description || t('NoDescription') || 'No description'}
                                        </td>
                                        <td>
                                            {project.archivedAt ? (
                                <Badge color="secondary">{t('Archived') || 'Archived'}</Badge>
                                            ) : (
                                <Badge color="success">{t('Active') || 'Active'}</Badge>
                                            )}
                                        </td>
                                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                                        <td>
                            <div className="hstack gap-3 flex-wrap">
                                            <Link 
                                                to={`/companies/${workspace?.companyId || companyId || ''}/projects/${project.id}`}
                                                state={{ companyId: workspace?.companyId || companyId }}
                                    className="link-success fs-15"
                                    title={t('View') || 'View'}
                                >
                                    <i className="ri-eye-line"></i>
                                </Link>
                                <Link
                                    to="#"
                                    className="link-primary fs-15"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onClickEdit(project);
                                    }}
                                    title={t('Edit') || 'Edit'}
                                >
                                    <i className="ri-pencil-line"></i>
                                </Link>
                                <Link
                                    to="#"
                                    className="link-danger fs-15"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onClickDelete(project);
                                    }}
                                    title={t('Delete') || 'Delete'}
                                >
                                    <i className="ri-delete-bin-line"></i>
                                            </Link>
                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
    );

    return (
        <div className="px-4 py-4">
            <ToastContainer closeButton={false} />
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteProject}
                onCloseClick={() => setDeleteModal(false)}
                isLoading={deleteProjectMutation.isPending}
            />
            <EditProjectModal
                open={editModal}
                onClose={() => setEditModal(false)}
                onUpdated={() => {
                    queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
                }}
                project={selectedProject}
            />
            <CreateProjectModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                onCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
                }}
            />
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('Projects') || 'Projects'}</h5>
                        <div className="d-flex gap-2">
                            <div className="btn-group" role="group">
                                <Button
                                    color={viewMode === 'card' ? 'primary' : 'light'}
                                    onClick={() => setViewMode('card')}
                                    className="btn-icon"
                                    size="sm"
                                >
                                    <i className="ri-grid-fill"></i>
                                </Button>
                                <Button
                                    color={viewMode === 'list' ? 'primary' : 'light'}
                                    onClick={() => setViewMode('list')}
                                    className="btn-icon"
                                    size="sm"
                                >
                                    <i className="ri-list-check"></i>
                                </Button>
                            </div>
                            <Button color="success" size="sm" onClick={handleCreateProject}>
                                <i className="ri-add-line me-1"></i> {t('AddProject') || 'Add Project'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {viewMode === 'card' ? renderCardView() : renderListView()}
                </CardBody>
            </Card>
        </div>
    );
};

export default ProjectTab;