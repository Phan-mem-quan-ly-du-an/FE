import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {
    Card,
    CardBody,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Row,
    UncontrolledDropdown,
    Spinner,
    Button,
    Table,
    Badge
} from 'reactstrap';
import {ToastContainer, toast} from 'react-toastify';
import {useTranslation} from 'react-i18next';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import slack from '../../assets/images/brands/slack.png';
import dribbble from '../../assets/images/brands/dribbble.png';
import mailChimp from '../../assets/images/brands/mail_chimp.png';
import dropbox from '../../assets/images/brands/dropbox.png';
import { useParams, useNavigate } from "react-router-dom";
import { AxiosError } from 'axios';

import FeatherIcon from 'feather-icons-react';

import DeleteModal from './DeleteModal';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import {getProjectsMine, deleteProject, Project} from '../../apiCaller/projects';

interface ListProps {
    workspaceId?: string;
}

const List = ({workspaceId}: ListProps = {}) => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const [project, setProject] = useState<any>(null);
    const [searchInput, setSearchInput] = useState<string>('');
    const [appliedSearch, setAppliedSearch] = useState<string>('');
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [editModal, setEditModal] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();

    const mapProjectToComponentFormat = (apiProject: Project, index: number) => {
        const imageMap = [slack, dribbble, mailChimp, dropbox];

        return {
            id: apiProject.id,
            time: `${t('Updated')} ${new Date(apiProject.updatedAt).toLocaleDateString()}`,
            img: imageMap[index % imageMap.length],
            color: apiProject.color || '#3b82f6',
            label: apiProject.name,
            caption: apiProject.description || t('NoDescriptionAvailable'),
            date: new Date(apiProject.createdAt).toLocaleDateString(),
            ratingClass: apiProject.status === 'active' ? 'active' : ''
        };
    };

    const {
        data: projects = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery<Project[]>({
        queryKey: ['projects', 'mine', companyId, workspaceId],
        queryFn: () => getProjectsMine({ companyId, ...(workspaceId ? { workspaceId } : {}) }),
        enabled: !!companyId,
    });

    useEffect(() => {
        if (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status;
                if (status === 401) {
                    toast.error('Session expired. Please login again.');
                    navigate('/');
                    return;
                }
                if (status === 403) {
                    toast.error('You do not have permission to view projects in this company.');
                    return;
                }
                if (status && status >= 500) {
                    toast.error(t('FailedToLoadProjects'));
                    return;
                }
            }
            console.error('Error fetching projects:', error);
            toast.error(t('FailedToLoadProjects'));
        }
    }, [error, t, navigate]);

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', 'mine', companyId, workspaceId] });
            setDeleteModal(false);
            toast.success(t('ProjectDeletedSuccessfully') || 'Project deleted successfully');
        },
        onError: (err: unknown) => {
            console.error('Error deleting project:', err);
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                if (status === 401) {
                    toast.error('Session expired. Please login again.');
                    navigate('/');
                    return;
                }
                if (status === 403) {
                    toast.error('You do not have permission to delete this project.');
                    return;
                }
            }
            toast.error(t('FailedToDeleteProject') || 'Failed to delete project');
        }
    });

    const filteredProjects = appliedSearch
        ? projects.filter(p => p.name?.toLowerCase().includes(appliedSearch.toLowerCase()))
        : projects;

    const projectLists = filteredProjects.map((project: Project, index: number) =>
        mapProjectToComponentFormat(project, index)
    );

    const onClickData = (project: any) => {
        setProject(project);
        setDeleteModal(true);
    };

    const handleDeleteProjectList = () => {
        if (project) {
            deleteProjectMutation.mutate(project.id);
        }
    };

    const handleCreateProject = () => {
        setCreateModal(true);
    };

    const onClickEdit = (project: Project) => {
        setSelectedProject(project);
        setEditModal(true);
    };

    const renderCardView = () => (
        <div className="row">
            {(projectLists || []).map((item: any, index: number) => (
                <React.Fragment key={index}>
                    <Col xxl={3} sm={6} className="project-card">
                        <Card
                            className="card-height-100"
                            onClick={() => navigate(`/companies/${companyId}/projects/${item.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <CardBody>
                                <div className="d-flex flex-column h-100">
                                    <div className="d-flex">
                                        <div className="flex-grow-1"></div>
                                        <div className="flex-shrink-0">
                                            <div className="d-flex gap-1 align-items-center">
                                                <UncontrolledDropdown direction="start">
                                                    <DropdownToggle
                                                        tag="button"
                                                        className="btn btn-link text-muted p-1 mt-n2 py-0 text-decoration-none fs-15"
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    >
                                                        <FeatherIcon icon="more-horizontal" className="icon-sm" />
                                                    </DropdownToggle>
                                                    <DropdownMenu
                                                        className="dropdown-menu-end"
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    >
                                                        <DropdownItem
                                                            tag={Link}
                                                            to={`/companies/${companyId}/projects/${item.id}`}
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                        >
                                                            <i className="ri-eye-fill align-bottom me-2 text-muted"></i> {t('View')}
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            href="#"
                                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClickEdit(projects[index]); }}
                                                        >
                                                            <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> {t('Edit')}
                                                        </DropdownItem>
                                                        <div className="dropdown-divider"></div>
                                                        <DropdownItem
                                                            href="#"
                                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClickData(item); }}
                                                        >
                                                            <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> {t('Remove')}
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex mb-2">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <span
                                                    className="avatar-title rounded p-2"
                                                    style={{ backgroundColor: item.color }}
                                                >
                                                  <img src={item.img} alt="" className="img-fluid p-1" />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center mb-1">
                                                <h5 className="mb-0 fs-15 me-2">
                                                    <span className="text-dark">{item.label}</span>
                                                </h5>
                                                <Badge color="success" className="badge-soft-success">{t('ProjectActive')}</Badge>
                                            </div>
                                            <p className="text-muted text-truncate-two-lines mb-3">{item.caption}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                            <div className="card-footer bg-transparent border-top-dashed py-2">
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1"></div>
                                    <div className="flex-shrink-0">
                                        <div className="text-muted">
                                            <i className="ri-calendar-event-fill me-1 align-bottom"></i> {item.date}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </React.Fragment>
            ))}
        </div>
    );

    const renderListView = () => (
        <Card>
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
                        {projectLists.map((item: any, index: number) => (
                            <tr
                                key={index}
                                onClick={() => navigate(`/companies/${companyId}/projects/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm me-2">
                                                <span
                                                    className="avatar-title rounded p-1"
                                                    style={{ backgroundColor: item.color }}
                                                >
                                                    <img src={item.img} alt="" className="img-fluid p-1" />
                                                </span>
                                        </div>
                                        <span className="fw-semibold link-primary">{item.label}</span>
                                    </div>
                                </td>
                                <td className="text-muted">{item.caption}</td>
                                <td>
                                    <Badge color="success">{t('ProjectActive')}</Badge>
                                </td>
                                <td>{item.date}</td>
                                <td>
                                    <div className="hstack gap-3 flex-wrap">
                                        <a
                                            href="#"
                                            className="link-success fs-15"
                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/companies/${companyId}/projects/${item.id}`); }}
                                        >
                                            <i className="ri-eye-line"></i>
                                        </a>

                                        <a
                                            href="#"
                                            className="link-primary fs-15"
                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClickEdit(projects[index]); }}
                                        >
                                            <i className="ri-pencil-line"></i>
                                        </a>

                                        <a
                                            href="#"
                                            className="link-danger fs-15"
                                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClickData(item); }}
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <React.Fragment>
            <ToastContainer closeButton={false}/>
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeleteProjectList()}
                onCloseClick={() => setDeleteModal(false)}
                isLoading={deleteProjectMutation.isPending}
            />
            <CreateProjectModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                onCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', 'mine', companyId, workspaceId] });
                }}
            />
            <EditProjectModal
                open={editModal}
                onClose={() => setEditModal(false)}
                onUpdated={() => {
                    queryClient.invalidateQueries({ queryKey: ['projects', 'mine', companyId, workspaceId] });
                }}
                project={selectedProject}
            />
            <Row className="g-4 mb-3">
                <div className="col-sm-auto">
                    <div>
                        <Button
                            color="secondary"
                            outline
                            onClick={handleCreateProject}
                            className="btn-soft-secondary"
                        >
                            <i className="ri-add-line align-bottom me-1"></i> {t('AddNew')}
                        </Button>
                    </div>
                </div>
                <div className="col-sm">
                    <div className="d-flex justify-content-sm-end gap-2">
                        <div className="search-box ms-2">
                            <Input
                                type="text"
                                className="form-control"
                                placeholder={t('Search')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        setAppliedSearch(searchInput.trim());
                                    }
                                }}
                            />
                            <i className="ri-search-line search-icon"></i>
                        </div>
                        <div className="btn-group" role="group">
                            <Button
                                color={viewMode === 'card' ? 'primary' : 'light'}
                                onClick={() => setViewMode('card')}
                                className="btn-icon"
                            >
                                <i className="ri-grid-fill"></i>
                            </Button>
                            <Button
                                color={viewMode === 'list' ? 'primary' : 'light'}
                                onClick={() => setViewMode('list')}
                                className="btn-icon"
                            >
                                <i className="ri-list-check"></i>
                            </Button>
                        </div>
                    </div>
                </div>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                    <Spinner color="primary" />
                    <span className="ms-2">{t('LoadingProjects')}</span>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    <i className="ri-error-warning-line me-2"></i>
                    {t('FailedToLoadProjects')}
                    <div className="mt-2">
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => refetch()}
                        >
                            {t('Retry')}
                        </button>
                    </div>
                </div>
            ) : projectLists.length === 0 ? (
                <div className="text-center py-5">
                    <div className="mb-3">
                        <i className="ri-folder-open-line" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    </div>
                    <h5 className="text-muted">{t('NoProjectsFound')}</h5>
                    <p className="text-muted">{t('GetStartedByCreating')}</p>
                    <Button
                        color="primary"
                        onClick={handleCreateProject}
                    >
                        <i className="ri-add-line me-1"></i> {t('CreateProject')}
                    </Button>
                </div>
            ) : (
                viewMode === 'card' ? renderCardView() : renderListView()
            )}
        </React.Fragment>
    );
};

export default List;